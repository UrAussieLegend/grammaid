import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiEnabled } from "@/lib/analysis/engine";
import { normalizeOptions, type AnalysisResult } from "@/lib/analysis/types";
import { ProjectWorkspace } from "@/components/project-workspace";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [project, preference] = await Promise.all([
    prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { analyses: { orderBy: { createdAt: "desc" }, take: 20 } },
    }),
    prisma.preference.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!project) notFound();

  const defaults = normalizeOptions(preference ? JSON.parse(preference.defaults) : {});
  if (!defaults.genre && project.genre) defaults.genre = project.genre;

  return (
    <ProjectWorkspace
      aiEnabled={aiEnabled}
      defaults={defaults}
      project={{
        id: project.id,
        title: project.title,
        synopsis: project.synopsis,
        genre: project.genre,
        audience: project.audience,
        content: project.content,
      }}
      analyses={project.analyses.map((a) => ({
        id: a.id,
        createdAt: a.createdAt.toISOString(),
        engine: a.engine,
        result: JSON.parse(a.result) as AnalysisResult,
      }))}
    />
  );
}
