import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  banned: z.boolean().optional(),
});

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  if (params.id === admin.id && (parsed.data.role === "USER" || parsed.data.banned)) {
    return NextResponse.json({ error: "You cannot demote or ban your own account." }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ user: { id: user.id, role: user.role, banned: user.banned } });
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (params.id === admin.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
