import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiEnabled } from "@/lib/analysis/engine";
import { googleEnabled } from "@/lib/auth";
import { AdminPanel } from "@/components/admin-panel";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, projectCount, analyses, totalTokens] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    }),
    prisma.project.count(),
    prisma.analysis.findMany({ select: { engine: true, createdAt: true, tokens: true } }),
    prisma.analysis.aggregate({ _sum: { tokens: true } }),
  ]);

  const words = await prisma.project.aggregate({ _sum: { wordCount: true } });
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    <AdminPanel
      currentUserId={session.user.id}
      stats={{
        users: users.length,
        admins: users.filter((u) => u.role === "ADMIN").length,
        banned: users.filter((u) => u.banned).length,
        projects: projectCount,
        analyses: analyses.length,
        analysesThisWeek: analyses.filter((a) => a.createdAt.getTime() > since).length,
        aiAnalyses: analyses.filter((a) => a.engine === "openai").length,
        tokens: totalTokens._sum.tokens ?? 0,
        words: words._sum.wordCount ?? 0,
      }}
      config={{ aiEnabled, googleEnabled }}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        banned: u.banned,
        createdAt: u.createdAt.toISOString(),
        projects: u._count.projects,
      }))}
    />
  );
}
