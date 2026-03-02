"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { format, subMonths } from "date-fns";

type Order = { total: { toString(): string }; createdAt: Date };

export function CombinedBudgetChart({ orders, dateLabel }: { orders: Order[]; dateLabel?: string }) {
  const data = useMemo(() => {
    const byMonth: Record<string, { month: string; revenues: number; expenditures: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "MMM");
      byMonth[key] = { month: key, revenues: 0, expenditures: 0 };
    }
    for (const o of orders) {
      const key = format(new Date(o.createdAt), "MMM");
      if (byMonth[key]) {
        const v = Number(o.total);
        byMonth[key].revenues += v;
        byMonth[key].expenditures += v * 0.7; // mock expenditure
      }
    }
    return Object.values(byMonth);
  }, [orders]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Combined budget</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">Revenues</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600">Expenditures</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
              formatter={(value: number) => [`৳${value?.toLocaleString()}`, ""]}
              labelFormatter={(label) => label}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="revenues" name="Revenues" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenditures" name="Expenditures" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {dateLabel && <p className="mt-2 text-xs text-gray-500">{dateLabel}</p>}
    </div>
  );
}
