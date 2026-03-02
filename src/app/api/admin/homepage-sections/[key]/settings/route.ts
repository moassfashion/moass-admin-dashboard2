import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { parseSectionConfig, stringifySectionConfig } from "@/lib/homepage-sections";
import { z } from "zod";

const bodySchema = z.object({
  mode: z.enum(["auto", "manual", "hybrid"]),
  max_items: z.number().int().min(2).max(16),
  auto_days: z.number().int().min(7).max(90).optional(),
  auto_category: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const { key } = await params;
  const section = await prisma.homepageSection.findUnique({ where: { key } });
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const body = await request.json();
  const data = bodySchema.parse(body);
  const config = parseSectionConfig(section.config);
  config.mode = data.mode;
  config.max_items = data.max_items;
  if (data.auto_days !== undefined) config.auto_days = data.auto_days;
  if (data.auto_category !== undefined) config.auto_category = data.auto_category;
  if (data.is_active !== undefined) config.is_active = data.is_active;

  await prisma.homepageSection.update({
    where: { key },
    data: {
      type: data.mode,
      config: stringifySectionConfig(config),
    },
  });

  return NextResponse.json({ ok: true });
}
