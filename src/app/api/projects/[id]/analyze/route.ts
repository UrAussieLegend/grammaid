import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { runAnalysis } from "@/lib/analysis/engine";
import { normalizeOptions } from "@/lib/analysis/types";

export const maxDuration = 120;

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.content.trim().length < 50) {
    return NextResponse.json(
      { error: "Add at least a paragraph of text before running an analysis." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { options?: unknown };
  const options = normalizeOptions(body.options);
  if (!options.genre && project.genre) options.genre = project.genre;
  if (project.audience) options.audience = project.audience;

  const { result, tokens } = await runAnalysis(project.content, options);

  const analysis = await prisma.analysis.create({
    data: {
      projectId: project.id,
      engine: result.engine,
      options: JSON.stringify(options),
      result: JSON.stringify(result),
      tokens,
    },
  });

  await prisma.preference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, defaults: JSON.stringify(options) },
    update: { defaults: JSON.stringify(options) },
  });

  return NextResponse.json({ analysis: { ...analysis, parsed: result } }, { status: 201 });
}
