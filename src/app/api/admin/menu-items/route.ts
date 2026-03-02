import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { menuItemToJson } from "@/lib/menu";
import { z } from "zod";

const createSchema = z.object({
  menuGroupId: z.string().min(1),
  label: z.string().min(1),
  link: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body. Required: menuGroupId, label, link." },
      { status: 400 }
    );
  }
  const group = await prisma.menuGroup.findUnique({
    where: { id: parsed.data.menuGroupId },
  });
  if (!group) {
    return NextResponse.json({ error: "Menu group not found." }, { status: 404 });
  }
  const item = await prisma.menuItem.create({
    data: parsed.data,
  });
  return NextResponse.json(menuItemToJson(item));
}
