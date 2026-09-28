import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { normalizeOptions } from "@/lib/analysis/types";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pref = await prisma.preference.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    defaults: normalizeOptions(pref ? JSON.parse(pref.defaults) : {}),
    theme: pref?.theme ?? "system",
  });
}

export async function PUT(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { defaults?: unknown; theme?: string };
  const defaults = normalizeOptions(body.defaults);
  const theme = ["light", "dark", "system"].includes(body.theme ?? "") ? body.theme! : "system";

  await prisma.preference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, defaults: JSON.stringify(defaults), theme },
    update: { defaults: JSON.stringify(defaults), theme },
  });

  return NextResponse.json({ defaults, theme });
}
