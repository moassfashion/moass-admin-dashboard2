import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { parseSectionConfig, stringifySectionConfig } from "@/lib/homepage-sections";
import { z } from "zod";

export async function POST(
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
  const { productId } = z.object({ productId: z.string() }).parse(body);
  const config = parseSectionConfig(section.config);
  if (config.pinned_product_ids.includes(productId)) {
    return NextResponse.json({ ok: true });
  }
  config.pinned_product_ids.push(productId);
  await prisma.homepageSection.update({
    where: { key },
    data: { config: stringifySectionConfig(config) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const config = parseSectionConfig(section.config);
  config.pinned_product_ids = config.pinned_product_ids.filter((id) => id !== productId);
  await prisma.homepageSection.update({
    where: { key },
    data: { config: stringifySectionConfig(config) },
  });
  return NextResponse.json({ ok: true });
}
