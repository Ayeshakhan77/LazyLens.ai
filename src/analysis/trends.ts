import type { TrendGranularity, TrendPoint, TrendResult } from "../types";

export interface TrendRow {
  date: Date | null;
  value: number | null;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function periodKey(date: Date, granularity: TrendGranularity): { period: string; label: string } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  if (granularity === "day") {
    const period = date.toISOString().slice(0, 10);
    return { period, label: period };
  }
  if (granularity === "month") {
    const padded = String(month + 1).padStart(2, "0");
    return { period: `${year}-${padded}`, label: `${MONTHS[month]} ${year}` };
  }
  return { period: `${year}`, label: `${year}` };
}

/**
 * Aggregate a numeric column over time. Granularity adapts to the span so the line
 * chart has a readable number of points (days for short ranges, months for a year or
 * two, years beyond that). Returns null when there is not enough paired data.
 */
export function computeTrend(
  dateColumn: string,
  valueColumn: string,
  rows: TrendRow[],
): TrendResult | null {
  const valid = rows.filter(
    (row): row is { date: Date; value: number } => row.date !== null && row.value !== null,
  );
  if (valid.length < 3) return null;

  valid.sort((a, b) => a.date.getTime() - b.date.getTime());
  const spanDays =
    (valid[valid.length - 1].date.getTime() - valid[0].date.getTime()) / 86_400_000;

  const granularity: TrendGranularity =
    spanDays <= 92 ? "day" : spanDays <= 365 * 3 ? "month" : "year";

  const buckets = new Map<string, { label: string; value: number; count: number }>();
  for (const { date, value } of valid) {
    const { period, label } = periodKey(date, granularity);
    const bucket = buckets.get(period) ?? { label, value: 0, count: 0 };
    bucket.value += value;
    bucket.count += 1;
    buckets.set(period, bucket);
  }

  const points: TrendPoint[] = Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([period, bucket]) => ({
      period,
      label: bucket.label,
      value: bucket.value,
      count: bucket.count,
    }));

  if (points.length < 2) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const deltaAbs = last.value - first.value;

  return {
    dateColumn,
    valueColumn,
    granularity,
    points,
    firstLabel: first.label,
    lastLabel: last.label,
    firstValue: first.value,
    lastValue: last.value,
    deltaAbs,
    deltaPct: first.value === 0 ? null : deltaAbs / Math.abs(first.value),
    totalValue: points.reduce((total, point) => total + point.value, 0),
  };
}
