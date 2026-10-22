import type { AnalysisResult } from "../types";

export const MIN_ROWS_FOR_CHARTS = 5;

export interface ChartCapabilities {
  rows: number;
  numeric: string[];
  categorical: string[];
  date: string[];
  bar: boolean;
  histogram: boolean;
  correlation: boolean;
  line: boolean;
  /** Human explanation for each chart we chose not to render. */
  reasons: {
    any: string | null;
    bar: string | null;
    histogram: string | null;
    correlation: string | null;
    line: string | null;
  };
}

/**
 * Decide which charts are statistically meaningful for this dataset. Every "no" comes
 * with a reason string so the UI can render an explanation card instead of a blank box.
 */
export function getChartCapabilities(analysis: AnalysisResult): ChartCapabilities {
  const rows = analysis.rowCount;
  const numeric = analysis.numericColumns;
  const categorical = analysis.categoricalColumns;
  const date = analysis.dateColumns;

  const reasons: ChartCapabilities["reasons"] = {
    any: null,
    bar: null,
    histogram: null,
    correlation: null,
    line: null,
  };

  const tooSmall = rows < MIN_ROWS_FOR_CHARTS;
  if (tooSmall) {
    reasons.any = `This dataset has only ${rows} row${rows === 1 ? "" : "s"}. Charts need at least ${MIN_ROWS_FOR_CHARTS} rows to say anything meaningful — upload more data and they will appear.`;
  }

  const bar = !tooSmall && categorical.length > 0;
  if (!tooSmall && !bar) {
    reasons.bar = "No categorical column was found, so there is nothing to group rows by.";
  }

  const histogram = !tooSmall && numeric.length > 0;
  if (!tooSmall && !histogram) {
    reasons.histogram = "No numeric column was found, so there is no distribution to plot.";
  }

  const correlation = !tooSmall && numeric.length >= 2;
  if (!tooSmall && !correlation) {
    reasons.correlation =
      numeric.length === 1
        ? "A correlation matrix needs at least two numeric columns; this dataset has one."
        : "No numeric columns were found to correlate.";
  }

  const line = !tooSmall && date.length > 0 && numeric.length > 0;
  if (!tooSmall && !line) {
    reasons.line =
      date.length === 0
        ? "No date-like column was found, so there is no timeline to plot."
        : "No numeric column was found to measure over time.";
  }

  return { rows, numeric, categorical, date, bar, histogram, correlation, line, reasons };
}
