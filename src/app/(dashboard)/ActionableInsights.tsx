import Link from "next/link";
import { AlertTriangle, Package, TrendingUp, Wallet } from "lucide-react";

export function ActionableInsights({
  pendingOrders,
  lowStockCount,
  topProducts,
  aov,
  dateLabel,
}: {
  pendingOrders: number;
  lowStockCount: number;
  topProducts: { id: string; name: string; quantity: number }[];
  aov: number;
  dateLabel: string;
}) {
  const items = [
    {
      label: "Pending orders",
      value: pendingOrders,
      href: "/orders?status=pending",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Low stock items",
      value: lowStockCount,
      href: "/inventory",
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "AOV (avg order value)",
      value: `৳${aov.toLocaleString()}`,
      href: undefined,
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Actionable insights</h3>
      <p className="text-xs text-gray-500">{dateLabel}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {items.map(({ label, value, href, icon: Icon, color, bg }) => {
          const card = (
            <div className={`flex items-center gap-3 rounded-lg ${bg} p-3`}>
              <div className={`rounded-lg bg-white p-2 shadow-sm ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          );
          if (href) {
            return (
              <Link key={label} href={href} className="block transition-opacity hover:opacity-90">
                {card}
              </Link>
            );
          }
          return <div key={label}>{card}</div>;
        })}
      </div>
      {topProducts.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-700">Top products (sold)</h4>
            <Link href="/reports" className="text-xs font-medium text-[var(--teal)] hover:underline">
              View report
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {topProducts.slice(0, 5).map((p, i) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <Link href={`/products/${p.id}/edit`} className="font-medium text-gray-900 hover:underline truncate max-w-[180px]">
                    {p.name}
                  </Link>
                </div>
                <span className="text-gray-500">{p.quantity} sold</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
