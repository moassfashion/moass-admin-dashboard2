"use client";

import { useSectionQuery } from "../hooks/use-homepage-sections";
import type { ResolvedProduct } from "@/types/homepage-sections";

export function PreviewTab({ sectionKey }: { sectionKey: string }) {
  const { data, isLoading, error } = useSectionQuery(sectionKey);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Failed to load preview.
      </p>
    );
  }

  const { products, pinned_count, auto_count } = data;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        <span className="font-medium text-gray-900">{pinned_count} pinned</span>
        {" + "}
        <span className="font-medium text-gray-900">{auto_count} auto-filled</span>
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map((p: ResolvedProduct) => (
          <div
            key={p.id}
            className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm"
          >
            <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
              {p.image ? (
                <img
                  src={p.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  No image
                </div>
              )}
              <span
                className="absolute right-1 top-1 text-lg"
                title={p.source === "pinned" ? "Pinned" : "Auto-selected"}
              >
                {p.source === "pinned" ? "📌" : "🤖"}
              </span>
            </div>
            <p className="mt-2 truncate text-sm font-medium text-gray-900">
              {p.name}
            </p>
            <p className="text-xs text-gray-500">
              ${p.price}
              {p.total_sales !== undefined && ` · ${p.total_sales} sold`}
              {p.days_ago !== undefined && ` · ${p.days_ago}d ago`}
            </p>
          </div>
        ))}
      </div>
      {products.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">
          No products in this section yet.
        </p>
      )}
    </div>
  );
}
