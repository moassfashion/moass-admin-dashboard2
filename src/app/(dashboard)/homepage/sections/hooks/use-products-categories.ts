"use client";

import { useQuery } from "@tanstack/react-query";

export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  price: { toString(): string };
  images: string | null;
  category: { id: string; name: string } | null;
  categoryId: string | null;
  createdAt: string;
};

export type ApiCategory = { id: string; name: string; slug: string };

async function fetchProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}): Promise<{ products: ApiProduct[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.categoryId) sp.set("categoryId", params.categoryId);
  const res = await fetch(`/api/admin/products?${sp}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

async function fetchProductsWithSales(
  categoryId?: string
): Promise<{ products: (ApiProduct & { total_sales?: number })[] }> {
  const { products, total } = await fetchProducts({
    limit: 100,
    categoryId: categoryId || undefined,
  });
  if (total > 100) {
    const rest = await fetchProducts({
      page: 2,
      limit: total - 100,
      categoryId: categoryId || undefined,
    });
    products.push(...rest.products);
  }
  return { products };
}

async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch("/api/admin/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export function useProductsQuery(options: {
  categoryId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["admin-products", options.categoryId, options.search],
    queryFn: () =>
      fetchProducts({
        limit: 100,
        categoryId: options.categoryId,
      }),
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchCategories,
  });
}
