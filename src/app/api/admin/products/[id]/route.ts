import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { getUncategorizedCategoryId } from "@/lib/product-data";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { categories: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  compareAt: z.number().positive().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  images: z.string().optional().nullable(),
  variationImages: z.string().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional().nullable(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const body = await request.json();
  const data = updateSchema.parse(body);
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.compareAt !== undefined) updateData.compareAt = data.compareAt;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.variationImages !== undefined) updateData.variationImages = data.variationImages;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.published !== undefined) updateData.published = data.published;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.categoryIds !== undefined) {
    const categoryIds =
      data.categoryIds.length > 0
        ? data.categoryIds
        : [await getUncategorizedCategoryId()];
    updateData.categories = { set: categoryIds.map((cid) => ({ id: cid })) };
  }
  const product = await prisma.product.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.product.update>[0]["data"],
    include: { categories: true },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
