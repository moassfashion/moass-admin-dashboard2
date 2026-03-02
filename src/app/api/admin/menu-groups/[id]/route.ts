import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { menuGroupToJson } from "@/lib/menu";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const group = await prisma.menuGroup.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(menuGroupToJson(group));
}

const updateSchema = z.object({
  key: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  placement: z.enum(["header", "footer"]).optional(),
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
  try {
    const group = await prisma.menuGroup.update({
      where: { id },
      data: parsed.data,
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(menuGroupToJson(group));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    if (String(msg).includes("Unique constraint")) {
      return NextResponse.json({ error: "A menu group with this key already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  await prisma.menuGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
