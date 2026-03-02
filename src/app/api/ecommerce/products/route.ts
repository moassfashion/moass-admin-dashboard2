import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public API for storefront – list published products only.
 * No auth required.
 * Query: page, limit, categoryId, search (optional)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const categoryId = searchParams.get("categoryId") || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const skip = (page - 1) * limit;

  const where = {
    published: true,
    ...(categoryId
      ? { categories: { some: { id: categoryId } } }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { categories: true },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, limit });
}
