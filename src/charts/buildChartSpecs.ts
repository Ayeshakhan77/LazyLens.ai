import type { CorrelationResult, NumericSummary, RankingResult, TrendResult } from "../types";
import { formatNumber } from "../lib/format";
import { type ChartTheme, seriesColor } from "./theme";

/** A Plotly figure, loosely typed so this module stays free of Plotly imports. */
export interface ChartSpec {
  data: Array<Record<string, unknown>>;
  layout: Record<string, unknown>;
}

const FONT = (theme: ChartTheme, size = 11) => ({
  family:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  size,
  color: theme.muted,
});

const BASE_CONFIG = {
  displayModeBar: false,
  responsive: true,
};

export const PLOT_CONFIG = {
  ...BASE_CONFIG,
  displaylogo: false,
};

function axis(theme: ChartTheme, title?: string) {
  return {
    title: title ? { text: title, font: FONT(theme, 11) } : undefined,
    gridcolor: theme.grid,
    zeroline: false,
    linecolor: theme.border,
    tickfont: FONT(theme),
    automargin: true,
  };
}

function baseLayout(theme: ChartTheme, height = 300): Record<string, unknown> {
  return {
    height,
    margin: { l: 56, r: 16, t: 10, b: 44 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: FONT(theme),
    showlegend: false,
    hoverlabel: {
      bgcolor: theme.surface,
      bordercolor: theme.border,
      font: { family: FONT(theme).family, size: 12, color: theme.foreground },
    },
  };
}

/** Horizontal bar: category comparison, ranked. */
export function buildBarSpec(ranking: RankingResult, theme: ChartTheme, height = 300): ChartSpec {
  // Plotly draws horizontal bars bottom-up, so reverse for a top-down ranking read.
  const entries = ranking.entries.slice(0, 10).reverse();
  const metric = ranking.metricColumn;
  const labels = entries.map((entry) => entry.key);
  const values = entries.map((entry) => (metric ? (entry.sum ?? 0) : entry.count));

  return {
    data: [
      {
        type: "bar",
        orientation: "h",
        x: values,
        y: labels,
        marker: { color: seriesColor(theme, 0) },
        hovertemplate: metric
          ? `%{y}<br>${metric}: %{x:,.2f}<extra></extra>`
          : "%{y}<br>rows: %{x:,}<extra></extra>",
      },
    ],
    layout: {
      ...baseLayout(theme, height),
      margin: { l: 120, r: 20, t: 10, b: 44 },
      xaxis: axis(theme, metric ? `Total ${metric}` : "Row count"),
      yaxis: { ...axis(theme), type: "category", automargin: true },
      bargap: 0.32,
    },
  };
}

/** Histogram: distribution of one numeric column. */
export function buildHistogramSpec(
  summary: NumericSummary,
  values: number[],
  theme: ChartTheme,
  height = 280,
): ChartSpec {
  return {
    data: [
      {
        type: "histogram",
        x: values,
        marker: { color: seriesColor(theme, 2) },
        hovertemplate: `range %{x}<br>${summary.column}: %{y} rows<extra></extra>`,
      },
    ],
    layout: {
      ...baseLayout(theme, height),
      xaxis: axis(theme, summary.column),
      yaxis: axis(theme, "Rows"),
      bargap: 0.04,
    },
  };
}

/** Diverging heatmap: correlation matrix. Blue = negative, maroon = positive. */
export function buildCorrelationSpec(correlation: CorrelationResult, theme: ChartTheme): ChartSpec {
  const columns = correlation.columns.slice(0, 8);
  const size = columns.length;
  const matrix = correlation.matrix.slice(0, size).map((row) => row.slice(0, size));

  return {
    data: [
      {
        type: "heatmap",
        z: matrix,
        x: columns,
        y: columns,
        zmin: -1,
        zmax: 1,
        colorscale: [
          [0, seriesColor(theme, 2)],
          [0.5, theme.surface],
          [1, seriesColor(theme, 0)],
        ],
        text: matrix.map((row) => row.map((value) => value.toFixed(2))),
        texttemplate: "%{text}",
        textfont: { family: FONT(theme).family, size: 11, color: theme.foreground },
        hovertemplate: "%{y} vs %{x}<br>r = %{z:.3f}<extra></extra>",
        colorbar: {
          thickness: 10,
          outlinewidth: 0,
          tickfont: FONT(theme),
        },
      },
    ],
    layout: {
      ...baseLayout(theme, Math.max(280, size * 52 + 90)),
      margin: { l: 120, r: 16, t: 10, b: 90 },
      xaxis: { ...axis(theme), tickangle: -35, side: "bottom" },
      yaxis: { ...axis(theme), automargin: true },
    },
  };
}

/** Line: one numeric column aggregated over time. */
export function buildLineSpec(trend: TrendResult, theme: ChartTheme, height = 300): ChartSpec {
  return {
    data: [
      {
        type: "scatter",
        mode: "lines+markers",
        x: trend.points.map((point) => point.label),
        y: trend.points.map((point) => point.value),
        line: { color: seriesColor(theme, 0), width: 2 },
        marker: { color: seriesColor(theme, 0), size: 6 },
        hovertemplate: `%{x}<br>${trend.valueColumn}: %{y:,.2f}<extra></extra>`,
      },
    ],
    layout: {
      ...baseLayout(theme, height),
      xaxis: { ...axis(theme, "Period"), type: "category" },
      yaxis: axis(theme, trend.valueColumn),
    },
  };
}

/** Compact one-line summary used as the chart card caption. */
export function describeBarChart(ranking: RankingResult): string {
  const top = ranking.entries[0];
  if (!top) return "";
  if (ranking.metricColumn) {
    return `Highest total ${ranking.metricColumn}: ${top.key} at ${formatNumber(top.sum ?? 0, 2)}.`;
  }
  return `Most frequent ${ranking.column}: ${top.key} with ${formatNumber(top.count, 0)} rows.`;
}
