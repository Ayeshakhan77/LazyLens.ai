import type { AnalysisResult } from "../types";
import { Card } from "./ui";
import { formatNumber, formatRatio } from "../lib/format";

interface Kpi {
  label: string;
  value: string;
  context: string;
}

/**
 * Generic, always-computable headline metrics. Deliberately does NOT look for
 * "revenue"/"sales" columns — those assumptions break on arbitrary uploads.
 */
export function KpiCards({ analysis }: { analysis: AnalysisResult }) {
  const kpis: Kpi[] = [
    {
      label: "Rows",
      value: formatNumber(analysis.rowCount, 0),
      context: analysis.sampled
        ? `of ${formatNumber(analysis.totalRowCount, 0)} in the file (capped)`
        : "data rows analysed",
    },
    {
      label: "Columns",
      value: formatNumber(analysis.columns.length, 0),
      context: `${formatNumber(analysis.numericColumns.length, 0)} numeric · ${formatNumber(
        analysis.categoricalColumns.length,
        0,
      )} categorical · ${formatNumber(analysis.dateColumns.length, 0)} date`,
    },
    {
      label: "Missing cells",
      value: formatRatio(analysis.missingPct),
      context: `${formatNumber(analysis.missingCellCount, 0)} of ${formatNumber(
        analysis.totalCellCount,
        0,
      )} cells`,
    },
    {
      label: "Duplicate rows",
      value: formatNumber(analysis.duplicateRowCount, 0),
      context: `${formatRatio(analysis.duplicatePct)} of rows`,
    },
    {
      label: "Outlier values",
      value: formatNumber(
        analysis.outliers.reduce((total, result) => total + result.count, 0),
        0,
      ),
      context:
        analysis.outliers.length > 0
          ? `across ${analysis.outliers.length} numeric column${
              analysis.outliers.length === 1 ? "" : "s"
            } (1.5×IQR)`
          : "no numeric outliers detected",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.label} as="div" className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {kpi.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tnum">
            {kpi.value}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{kpi.context}</p>
        </Card>
      ))}
    </div>
  );
}
