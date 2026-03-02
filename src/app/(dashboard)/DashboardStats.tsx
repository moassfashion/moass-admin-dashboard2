import Link from "next/link";

const cards = [
  {
    label: "Total Revenue",
    valueKey: "totalRevenue",
    desc: "New Revenue last 365 days",
    barColor: "bg-green-500",
    href: undefined,
  },
  {
    label: "Product Sales",
    valueKey: "productSales",
    desc: "Product Sales last 365 days",
    barColor: "bg-gray-800",
    href: "/products",
  },
  {
    label: "Completed Order",
    valueKey: "completedOrder",
    desc: "Completed Order last 365 days",
    barColor: "bg-green-500",
    href: "/orders?status=delivered",
  },
  {
    label: "Cancelled Order",
    valueKey: "cancelledOrder",
    desc: "Cancelled Order last 365 days",
    barColor: "bg-red-500",
    href: "/orders?status=cancelled",
  },
];

export function DashboardStats({
  totalRevenue,
  productSales,
  completedOrder,
  cancelledOrder,
  dateLabel,
}: {
  totalRevenue: number;
  productSales: number;
  completedOrder: number;
  cancelledOrder: number;
  dateLabel?: string;
}) {
  const values: Record<string, string> = {
    totalRevenue: `৳${totalRevenue.toLocaleString()}`,
    productSales: productSales.toLocaleString(),
    completedOrder: completedOrder.toLocaleString(),
    cancelledOrder: cancelledOrder.toLocaleString(),
  };

  const period = dateLabel ?? "Last 365 days";
  const desc: Record<string, string> = {
    totalRevenue: `Revenue (${period})`,
    productSales: `Product Sales (${period})`,
    completedOrder: `Completed (${period})`,
    cancelledOrder: `Cancelled (${period})`,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, valueKey, barColor, href }) => {
        const card = (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className={`mb-2 h-0.5 w-8 rounded-full ${barColor}`} />
            <p className="text-2xl font-bold tracking-tight text-gray-900">{values[valueKey]}</p>
            <p className="mt-1 text-xs text-gray-500">{desc[valueKey]}</p>
          </div>
        );
        if (href) {
          return (
            <Link key={label} href={href} className="block">
              {card}
            </Link>
          );
        }
        return <div key={label}>{card}</div>;
      })}
    </div>
  );
}
