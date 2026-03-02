import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

const UNCATEGORIZED_SLUG = "uncategorized";

/** Get or create the "Uncategorized" category. Used when a product has no categories. */
export async function getUncategorizedCategoryId(): Promise<string> {
  let cat = await prisma.category.findUnique({ where: { slug: UNCATEGORIZED_SLUG } });
  if (!cat) {
    cat = await prisma.category.create({
      data: {
        name: "Uncategorized",
        slug: UNCATEGORIZED_SLUG,
        sortOrder: 9999,
      },
    });
  }
  return cat.id;
}

/** Cached categories with children for product form (new/edit). Revalidates every 60s. */
export const getCategoriesForProductForm = unstable_cache(
  async () =>
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { children: { orderBy: { sortOrder: "asc" } } },
    }),
  ["product-form-categories"],
  { revalidate: 60 }
);
