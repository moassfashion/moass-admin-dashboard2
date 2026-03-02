import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { menuItemToJson } from "@/lib/menu";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  link: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const item = await prisma.menuItem.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(menuItemToJson(item));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
