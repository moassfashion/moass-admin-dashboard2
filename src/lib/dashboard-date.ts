import { startOfDay, endOfDay, subDays, format } from "date-fns";

export type DateRange = { from: Date; to: Date };

export function getDateRangeFromSearch(params: {
  range?: string;
  from?: string;
  to?: string;
}): DateRange {
  if (params.from && params.to) {
    const from = startOfDay(new Date(params.from));
    const to = endOfDay(new Date(params.to));
    return { from, to };
  }
  const days = Math.min(365, Math.max(1, parseInt(params.range ?? "30", 10) || 30));
  const to = endOfDay(new Date());
  const from = startOfDay(subDays(to, days - 1));
  return { from, to };
}

export function formatDateRangeLabel(range: DateRange): string {
  return `${format(range.from, "d MMM yyyy")} – ${format(range.to, "d MMM yyyy")}`;
}
