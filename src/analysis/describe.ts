import type { NumericSummary } from "../types";

/**
 * Quantile via linear interpolation (the "type 7" definition used by NumPy/pandas).
 * `sorted` must already be ascending.
 */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  const lower = sorted[base];
  const upper = sorted[base + 1];
  if (upper === undefined) return lower;
  return lower + rest * (upper - lower);
}

/** Descriptive statistics for one numeric column. Sample std (n−1). */
export function describeColumn(column: string, values: number[], missing = 0): NumericSummary {
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((total, value) => total + value, 0);
  const mean = count === 0 ? NaN : sum / count;

  const variance =
    count > 1
      ? sorted.reduce((total, value) => total + (value - mean) ** 2, 0) / (count - 1)
      : 0;

  return {
    column,
    count,
    missing,
    mean,
    median: quantile(sorted, 0.5),
    std: Math.sqrt(variance),
    min: count === 0 ? NaN : sorted[0],
    max: count === 0 ? NaN : sorted[count - 1],
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    sum,
  };
}
