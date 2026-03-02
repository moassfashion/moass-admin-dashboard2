import type { PrismaClient } from "@prisma/client";
import { parseSectionConfig } from "./homepage-sections";
import { SECTION_META } from "./homepage-sections";

export type ResolvedProduct = {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  category: string | null;
  source: "pinned" | "auto";
  total_sales?: number;
  days_ago?: number;
};

type SectionRow = { key: string; title: string | null; config: string | null };

export async function resolveSectionProducts(
  prisma: PrismaClient,
  section: SectionRow
): Promise<ResolvedProduct[]> {
  const config = parseSectionConfig(section.config);
  const pinnedIds = config.pinned_product_ids;

  const pinnedProducts =
    pinnedIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: pinnedIds }, published: true },
          include: { categories: true },
        })
      : [];
  const pinnedMap = new Map(pinnedProducts.map((p) => [p.id, p]));
  const orderedPinned = pinnedIds
    .map((id) => pinnedMap.get(id))
    .filter(Boolean) as typeof pinnedProducts;

  const firstCategoryName = (p: { categories?: { name: string }[] }) =>
    p.categories?.length ? p.categories[0].name : null;

  if (config.mode === "manual") {
    return orderedPinned.slice(0, config.max_items).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      image: p.images ? p.images.split(",")[0]?.trim() ?? null : null,
      category: firstCategoryName(p),
      source: "pinned" as const,
    }));
  }

  const excludeIds = new Set(orderedPinned.map((p) => p.id));
  const takeAuto = Math.max(0, config.max_items - orderedPinned.length);
  const where: {
    published: boolean;
    id?: { notIn: string[] };
    categories?: { some: { id: string } };
  } = {
    published: true,
  };
  if (excludeIds.size > 0) where.id = { notIn: [...excludeIds] };
  if (config.auto_category) where.categories = { some: { id: config.auto_category } };

  type ProductRow = Awaited<ReturnType<typeof prisma.product.findMany>>[number] & {
    categories?: { name: string }[];
  };
  let autoProducts: ProductRow[] = [];

  if (section.key === "new_arrivals") {
    const rows = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: takeAuto * 2,
      include: { categories: true },
    });
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - config.auto_days);
    autoProducts = rows.filter((p) => p.createdAt >= cutoff).slice(0, takeAuto) as ProductRow[];
  } else if (section.key === "best_selling") {
    const sold = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
    });
    const productIds = sold.map((s) => s.productId).filter((id) => !excludeIds.has(id)).slice(0, takeAuto);
    if (productIds.length > 0) {
      const rows = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          ...(config.auto_category ? { categories: { some: { id: config.auto_category } } } : {}),
        },
        include: { categories: true },
      });
      const salesMap = new Map(sold.map((s) => [s.productId, s._sum.quantity ?? 0]));
      rows.sort((a, b) => (salesMap.get(b.id) ?? 0) - (salesMap.get(a.id) ?? 0));
      autoProducts = rows as ProductRow[];
    }
  } else {
    const rows = await prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: takeAuto,
      include: { categories: true },
    });
    autoProducts = rows as ProductRow[];
  }

  const resolved: ResolvedProduct[] = [];
  for (const p of orderedPinned.slice(0, config.max_items)) {
    resolved.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      image: p.images ? p.images.split(",")[0]?.trim() ?? null : null,
      category: firstCategoryName(p),
      source: "pinned",
    });
  }
  const now = new Date();
  let salesMap = new Map<string, number>();
  if (section.key === "best_selling" && autoProducts.length > 0) {
    const sold = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { in: autoProducts.map((p) => p.id) } },
      _sum: { quantity: true },
    });
    salesMap = new Map(sold.map((s) => [s.productId, s._sum.quantity ?? 0]));
  }
  for (const p of autoProducts) {
    if (resolved.length >= config.max_items) break;
    const daysAgo = Math.floor((now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const total_sales = section.key === "best_selling" ? salesMap.get(p.id) : undefined;
    resolved.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      image: p.images ? p.images.split(",")[0]?.trim() ?? null : null,
      category: firstCategoryName(p),
      source: "auto",
      ...(section.key === "best_selling" && total_sales !== undefined && { total_sales }),
      ...(section.key === "new_arrivals" && { days_ago: daysAgo }),
    });
  }
  return resolved;
}

export function getSectionTitle(section: { key: string; title: string | null }): string {
  if (section.title) return section.title;
  const meta = SECTION_META[section.key as keyof typeof SECTION_META];
  return meta?.title ?? section.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
