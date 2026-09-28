import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectList } from "@/components/project-list";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      genre: true,
      audience: true,
      wordCount: true,
      updatedAt: true,
      _count: { select: { analyses: true } },
    },
  });

  return (
    <ProjectList
      userName={session.user.name ?? session.user.email ?? "writer"}
      projects={projects.map((p) => ({
        id: p.id,
        title: p.title,
        genre: p.genre,
        audience: p.audience,
        wordCount: p.wordCount,
        updatedAt: p.updatedAt.toISOString(),
        analyses: p._count.analyses,
      }))}
    />
  );
}
