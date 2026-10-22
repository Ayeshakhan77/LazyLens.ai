import type { OutlierResult } from "../types";
import { quantile } from "./describe";

export const IQR_MULTIPLIER = 1.5;
/** Below this many values an IQR fence is noise, so we skip it. */
export const MIN_VALUES_FOR_OUTLIERS = 8;

/**
 * IQR outlier detection (values beyond 1.5 × IQR from the quartiles).
 * Returns null when there are too few values or the column has no spread.
 */
export function findOutliers(column: string, values: number[]): OutlierResult | null {
  if (values.length < MIN_VALUES_FOR_OUTLIERS) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  if (!Number.isFinite(iqr) || iqr === 0) return null;

  const lowerBound = q1 - IQR_MULTIPLIER * iqr;
  const upperBound = q3 + IQR_MULTIPLIER * iqr;
  const outliers = values.filter((value) => value < lowerBound || value > upperBound);

  return {
    column,
    count: outliers.length,
    lowerBound,
    upperBound,
    values: outliers.sort((a, b) => a - b),
  };
}
