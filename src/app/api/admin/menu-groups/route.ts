import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { menuGroupToJson } from "@/lib/menu";
import { z } from "zod";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const groups = await prisma.menuGroup.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(groups.map(menuGroupToJson));
}

const createSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  placement: z.enum(["header", "footer"]),
  sortOrder: z.number().int().default(0),
});

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body. Required: key, label, placement (header|footer)." },
      { status: 400 }
    );
  }
  try {
    const group = await prisma.menuGroup.create({
      data: parsed.data,
      include: { items: true },
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
