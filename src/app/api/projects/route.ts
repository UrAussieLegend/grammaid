import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { wordCount } from "@/lib/extract";

const createSchema = z.object({
  title: z.string().trim().min(1).max(160),
  synopsis: z.string().max(4000).optional(),
  genre: z.string().max(80).optional(),
  audience: z.string().max(80).optional(),
  content: z.string().max(400_000).optional(),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
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

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Project title is required." }, { status: 400 });
  }

  const content = parsed.data.content ?? "";
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      synopsis: parsed.data.synopsis ?? "",
      genre: parsed.data.genre ?? "",
      audience: parsed.data.audience ?? "",
      content,
      wordCount: wordCount(content),
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
