import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { parseSectionConfig, stringifySectionConfig } from "@/lib/homepage-sections";
import { z } from "zod";

const bodySchema = z.object({
  productIds: z.array(z.string()),
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
  const { productIds } = bodySchema.parse(body);
  const config = parseSectionConfig(section.config);
  config.pinned_product_ids = productIds;
  await prisma.homepageSection.update({
    where: { key },
    data: { config: stringifySectionConfig(config) },
  });
  return NextResponse.json({ ok: true });
}
