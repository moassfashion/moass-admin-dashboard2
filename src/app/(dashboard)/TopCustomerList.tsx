import Link from "next/link";

export function TopCustomerList({
  customers,
  dateLabel,
}: {
  customers: { id: string; name: string | null; email: string; totalSpent: number; orderCount: number }[];
  dateLabel: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Top customers</h3>
      <p className="text-xs text-gray-500">{dateLabel}</p>
      {customers.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No orders in this period.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {customers.slice(0, 5).map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                    {(c.name ?? c.email).charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{c.name || c.email}</p>
                    <p className="text-xs text-gray-500">{c.orderCount} orders</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">৳{c.totalSpent.toLocaleString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
