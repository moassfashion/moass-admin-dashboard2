import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

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
