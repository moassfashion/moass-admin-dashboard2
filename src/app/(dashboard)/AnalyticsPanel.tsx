"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function AnalyticsPanel({
  inStockCount,
  outStockCount,
  totalProducts,
  totalOrders,
  dateLabel,
}: {
  inStockCount: number;
  outStockCount: number;
  totalProducts: number;
  totalOrders: number;
  dateLabel?: string;
}) {
  const total = inStockCount + outStockCount || 1;
  const inStockPct = Math.round((inStockCount / total) * 100);
  const outStockPct = 100 - inStockPct;
  const data = [
    { name: "In Stock", value: inStockCount, color: "#10B981" },
    { name: "Out Stock", value: outStockCount, color: "#9CA3AF" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Analytics</h3>
      <p className="text-xs text-gray-500">{dateLabel ?? "Stock & orders overview"}</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={64}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [`${v} (${name})`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{inStockPct}%</span>
            <span className="text-xs text-gray-500">In Stock</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{totalProducts.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Products</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
        </div>
      </div>
    </div>
  );
}
