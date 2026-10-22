import type { RankingEntry, RankingResult } from "../types";

export interface RankingRow {
  key: string;
  value: number | null;
}

/**
 * Rank distinct values of a categorical column. When a metric column is supplied the
 * ranking is by summed metric value; otherwise by row count. Returns null for an
 * empty column.
 */
export function rankCategories(
  column: string,
  metricColumn: string | null,
  rows: RankingRow[],
): RankingResult | null {
  const buckets = new Map<string, { count: number; sum: number; numericCount: number }>();

  for (const { key, value } of rows) {
    if (key === "") continue;
    const bucket = buckets.get(key) ?? { count: 0, sum: 0, numericCount: 0 };
    bucket.count += 1;
    if (value !== null) {
      bucket.sum += value;
      bucket.numericCount += 1;
    }
    buckets.set(key, bucket);
  }

  if (buckets.size === 0) return null;

  const totalRows = rows.filter((row) => row.key !== "").length;

  const entries: RankingEntry[] = Array.from(buckets.entries()).map(([key, bucket]) => ({
    key,
    count: bucket.count,
    sum: metricColumn ? bucket.sum : null,
    mean: metricColumn && bucket.numericCount > 0 ? bucket.sum / bucket.numericCount : null,
    share: totalRows > 0 ? bucket.count / totalRows : 0,
  }));

  entries.sort(
    metricColumn
      ? (a, b) => (b.sum ?? 0) - (a.sum ?? 0)
      : (a, b) => b.count - a.count,
  );

  return { column, metricColumn, entries };
}
