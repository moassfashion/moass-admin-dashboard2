"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const PRESETS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 365 days", value: "365" },
] as const;

export function DashboardDateFilter({
  range,
  from,
  to,
  dateLabel,
}: {
  range?: string;
  from?: string;
  to?: string;
  dateLabel: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setRange = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("range", value);
      next.delete("from");
      next.delete("to");
      router.push(`/?${next.toString()}`);
    },
    [router, searchParams]
  );

  const setCustomRange = useCallback(
    (fromDate: string, toDate: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("from", fromDate);
      next.set("to", toDate);
      next.delete("range");
      router.push(`/?${next.toString()}`);
    },
    [router, searchParams]
  );

  const currentRange = range ?? "30";
  const isCustom = !range && from && to;
  const fromVal = from ?? "";
  const toVal = to ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setRange(p.value)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              !isCustom && currentRange === p.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <input
          type="date"
          value={fromVal}
          max={toVal || undefined}
          onChange={(e) => {
            const f = e.target.value;
            const t = toVal || new Date().toISOString().slice(0, 10);
            if (f) setCustomRange(f, t);
          }}
          className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700"
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={toVal}
          min={fromVal || undefined}
          onChange={(e) => {
            const t = e.target.value;
            const f = fromVal || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            if (t) setCustomRange(f, t);
          }}
          className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700"
        />
      </div>
      <span className="text-xs text-gray-500">{dateLabel}</span>
    </div>
  );
}
