import type {
  AnalysisResult,
  OutlierResult,
  ParsedCsv,
  RankingResult,
} from "../types";
import { parseDate, toNumber } from "../data/cell";
import { profileColumns } from "../data/profile";
import { correlationMatrix } from "./correlation";
import { describeColumn } from "./describe";
import { findOutliers } from "./outliers";
import { analyzeQuality } from "./quality";
import { rankCategories } from "./rankings";
import { computeTrend } from "./trends";

/** Ranking a column with more distinct values than this usually just lists IDs. */
const MAX_RANKING_CARDINALITY = 50;
const MAX_RANKING_COLUMNS = 5;

/** Row-aligned numeric values (null where missing/unparseable) for a column. */
export function alignedNumeric(parsed: ParsedCsv, index: number): Array<number | null> {
  return parsed.rows.map((row) => toNumber(row[index] ?? ""));
}

function countDuplicateRows(rows: string[][]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const key = row.join("\u0001");
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  return duplicates;
}

/**
 * Run the full deterministic analysis: profiles, quality findings, descriptive stats,
 * outliers, correlation, trend and rankings. Pure — the input dataset is never mutated.
 */
export function runAnalysis(parsed: ParsedCsv): AnalysisResult {
  const columns = profileColumns(parsed);

  const numericColumns = columns.filter((column) => column.type === "numeric");
  const dateColumns = columns.filter((column) => column.type === "date");
  const categoricalColumns = columns.filter((column) => column.type === "categorical");

  const summaries = numericColumns.map((column) =>
    describeColumn(column.name, column.numericValues, column.missing),
  );

  const outliers = numericColumns
    .map((column) => findOutliers(column.name, column.numericValues))
    .filter((result): result is OutlierResult => result !== null);

  const correlation = correlationMatrix(
    numericColumns.map((column) => ({
      name: column.name,
      values: alignedNumeric(parsed, column.index),
    })),
  );

  const primaryDate = dateColumns[0];
  const primaryNumeric = numericColumns[0];

  const trend =
    primaryDate && primaryNumeric
      ? computeTrend(
          primaryDate.name,
          primaryNumeric.name,
          parsed.rows.map((row) => ({
            date: parseDate(row[primaryDate.index] ?? ""),
            value: toNumber(row[primaryNumeric.index] ?? ""),
          })),
        )
      : null;

  const metricColumn = primaryNumeric?.name ?? null;
  const rankings = categoricalColumns
    .filter(
      (column) => column.distinct > 1 && column.distinct <= MAX_RANKING_CARDINALITY,
    )
    .slice(0, MAX_RANKING_COLUMNS)
    .map((column) => {
      const metricValues = primaryNumeric ? alignedNumeric(parsed, primaryNumeric.index) : null;
      return rankCategories(
        column.name,
        metricColumn,
        parsed.rows.map((row, index) => ({
          key: (row[column.index] ?? "").trim(),
          value: metricValues ? metricValues[index] : null,
        })),
      );
    })
    .filter((result): result is RankingResult => result !== null);

  const quality = analyzeQuality({
    rowCount: parsed.rowCount,
    repairs: parsed.repairs,
    columns,
    rows: parsed.rows,
  });

  const duplicateRowCount = countDuplicateRows(parsed.rows);
  const missingCellCount = columns.reduce((total, column) => total + column.missing, 0);
  const totalCellCount = parsed.rowCount * parsed.headers.length;

  return {
    columns,
    quality,
    summaries,
    outliers,
    correlation,
    trend,
    rankings,
    numericColumns: numericColumns.map((column) => column.name),
    dateColumns: dateColumns.map((column) => column.name),
    categoricalColumns: categoricalColumns.map((column) => column.name),
    rowCount: parsed.rowCount,
    totalRowCount: parsed.totalRowCount,
    sampled: parsed.sampled,
    duplicateRowCount,
    missingCellCount,
    totalCellCount,
    missingPct: totalCellCount > 0 ? missingCellCount / totalCellCount : 0,
    duplicatePct: parsed.rowCount > 0 ? duplicateRowCount / parsed.rowCount : 0,
    analyzedAt: new Date().toISOString(),
  };
}
