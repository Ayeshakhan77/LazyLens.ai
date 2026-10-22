import type { CorrelationPair, CorrelationResult } from "../types";

/** Pearson correlation between two equal-length numeric arrays. */
export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return NaN;

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    covariance += da * db;
    varianceA += da * da;
    varianceB += db * db;
  }
  if (varianceA === 0 || varianceB === 0) return 0;
  return covariance / Math.sqrt(varianceA * varianceB);
}

/**
 * Pearson over row-aligned columns, using only rows where BOTH values are present.
 * This is why the analysis layer passes nullable, row-aligned arrays rather than
 * compacted ones.
 */
export function pearsonAligned(a: Array<number | null>, b: Array<number | null>): number {
  const xs: number[] = [];
  const ys: number[] = [];
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i];
    const y = b[i];
    if (x === null || y === null) continue;
    xs.push(x);
    ys.push(y);
  }
  return pearson(xs, ys);
}

export interface NumericColumn {
  name: string;
  values: Array<number | null>;
}

/** Full Pearson matrix. Returns null when fewer than two columns have usable data. */
export function correlationMatrix(columns: NumericColumn[]): CorrelationResult | null {
  const usable = columns.filter((column) => column.values.filter((v) => v !== null).length >= 3);
  if (usable.length < 2) return null;

  const names = usable.map((column) => column.name);
  const matrix: number[][] = names.map(() => names.map(() => 0));
  const strongest: CorrelationPair[] = [];

  for (let i = 0; i < usable.length; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < usable.length; j++) {
      const r = pearsonAligned(usable[i].values, usable[j].values);
      const safe = Number.isFinite(r) ? r : 0;
      matrix[i][j] = safe;
      matrix[j][i] = safe;
      strongest.push({ a: names[i], b: names[j], r: safe });
    }
  }

  strongest.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  return { columns: names, matrix, strongest };
}
