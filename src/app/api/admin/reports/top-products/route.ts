import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const items = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { categories: true },
  });
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const top = items.map((i) => ({
    product: byId[i.productId],
    quantity: i._sum.quantity ?? 0,
    orderCount: i._count.id,
  }));
  return NextResponse.json({ top });
}
