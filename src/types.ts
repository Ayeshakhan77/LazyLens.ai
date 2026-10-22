/**
 * Shared domain types for LazyLens AI.
 *
 * Everything in `data/`, `analysis/`, `charts/` and `ai/buildSummary.ts` is pure and
 * framework-free, so these types are the contract between the analysis layer and the UI.
 */

export type ColumnType = "numeric" | "date" | "categorical" | "empty";

export type Severity = "info" | "warning" | "critical";

/** A header that had to be rewritten because it was blank or a duplicate. */
export interface HeaderRepair {
  index: number;
  original: string;
  normalized: string;
  reason: "blank" | "duplicate";
}

export interface ParsedCsv {
  fileName: string;
  /** Header text exactly as it appeared in the file. */
  rawHeaders: string[];
  /** De-duplicated, non-empty header names actually used for the columns. */
  headers: string[];
  /** Data rows (header excluded), aligned index-for-index with `headers`. */
  rows: string[][];
  /** Number of rows actually held in memory (capped at MAX_ROWS). */
  rowCount: number;
  /** Row count in the source file, before any cap. */
  totalRowCount: number;
  /** True when the file had more rows than we keep in memory. */
  sampled: boolean;
  repairs: HeaderRepair[];
}

export interface ColumnProfile {
  name: string;
  index: number;
  type: ColumnType;
  total: number;
  missing: number;
  distinct: number;
  /** Share of non-missing values that parse as numbers (0–1). */
  numericRatio: number;
  /** Share of non-missing values that parse as dates (0–1). */
  dateRatio: number;
  /** Parsed numeric values from this column (non-missing only). */
  numericValues: number[];
  /** Most frequent raw values, for categorical context. */
  topValues: { value: string; count: number }[];
}

export type QualityCategory =
  | "header-repair"
  | "missing"
  | "duplicate-rows"
  | "constant"
  | "mixed-type"
  | "empty-column"
  | "outlier";

export interface QualityIssue {
  id: string;
  severity: Severity;
  category: QualityCategory;
  column?: string;
  title: string;
  /** What was actually found, with real numbers from the data. */
  observed: string;
  /** What the user could do about it. Never applied automatically. */
  recommendation: string;
}

export interface NumericSummary {
  column: string;
  count: number;
  missing: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  sum: number;
}

export interface OutlierResult {
  column: string;
  count: number;
  lowerBound: number;
  upperBound: number;
  values: number[];
}

export interface CorrelationPair {
  a: string;
  b: string;
  r: number;
}

export interface CorrelationResult {
  columns: string[];
  matrix: number[][];
  /** Pairs sorted by |r| descending — useful for the "strongest relationships" line. */
  strongest: CorrelationPair[];
}

export type TrendGranularity = "day" | "month" | "year";

export interface TrendPoint {
  /** ISO-ish sort key for the period. */
  period: string;
  /** Human label for tooltips/axis. */
  label: string;
  value: number;
  count: number;
}

export interface TrendResult {
  dateColumn: string;
  valueColumn: string;
  granularity: TrendGranularity;
  points: TrendPoint[];
  firstLabel: string;
  lastLabel: string;
  firstValue: number;
  lastValue: number;
  deltaAbs: number;
  /** Null when the first period was 0, so a percentage is undefined. */
  deltaPct: number | null;
  totalValue: number;
}

export interface RankingEntry {
  key: string;
  count: number;
  /** Sum of the metric column, or null when the column has no numeric partner. */
  sum: number | null;
  mean: number | null;
  /** Share of all rows represented by this key (0–1). */
  share: number;
}

export interface RankingResult {
  column: string;
  metricColumn: string | null;
  entries: RankingEntry[];
}

export interface AnalysisResult {
  columns: ColumnProfile[];
  quality: QualityIssue[];
  summaries: NumericSummary[];
  outliers: OutlierResult[];
  correlation: CorrelationResult | null;
  trend: TrendResult | null;
  rankings: RankingResult[];
  numericColumns: string[];
  dateColumns: string[];
  categoricalColumns: string[];
  rowCount: number;
  totalRowCount: number;
  sampled: boolean;
  duplicateRowCount: number;
  missingCellCount: number;
  totalCellCount: number;
  missingPct: number;
  duplicatePct: number;
  analyzedAt: string;
}
