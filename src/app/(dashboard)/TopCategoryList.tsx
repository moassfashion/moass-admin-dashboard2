import Link from "next/link";
import { FolderTree } from "lucide-react";

export function TopCategoryList({
  categories,
  dateLabel,
}: {
  categories: { id: string; name: string; revenue: number; orderCount: number }[];
  dateLabel: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Top categories</h3>
      <p className="text-xs text-gray-500">{dateLabel}</p>
      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No orders in this period.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {categories.slice(0, 5).map((c, i) => (
            <li key={c.id}>
              <Link
                href="/categories"
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <FolderTree className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.orderCount} orders</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">৳{c.revenue.toLocaleString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
