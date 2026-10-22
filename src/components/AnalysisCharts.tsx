import type { AnalysisResult, RankingResult } from "../types";
import { getChartCapabilities } from "../charts/capabilities";
import {
  buildBarSpec,
  buildCorrelationSpec,
  buildHistogramSpec,
  buildLineSpec,
  describeBarChart,
} from "../charts/buildChartSpecs";
import type { ChartTheme } from "../charts/theme";
import { formatNumber, formatSignedPct } from "../lib/format";
import { ChartCard, ReasonCard } from "./ChartCard";
import { Plot } from "./Plot";

const MAX_HISTOGRAMS = 4;

/**
 * Pick the most informative categorical column for the bar chart: the one with the most
 * categories that still fit legibly (2–10). This avoids ranking columns with one value
 * or hundreds of IDs.
 */
function pickBarRanking(rankings: RankingResult[]): RankingResult | null {
  if (rankings.length === 0) return null;
  const readable = rankings.filter(
    (ranking) => ranking.entries.length >= 2 && ranking.entries.length <= 10,
  );
  if (readable.length === 0) return rankings[0];
  return readable.reduce(
    (best, ranking) => (ranking.entries.length > best.entries.length ? ranking : best),
    readable[0],
  );
}

function correlationStrength(r: number): string {
  const magnitude = Math.abs(r);
  if (magnitude >= 0.7) return "a strong";
  if (magnitude >= 0.4) return "a moderate";
  if (magnitude >= 0.2) return "a weak";
  return "a very weak";
}

export function AnalysisCharts({
  analysis,
  theme,
}: {
  analysis: AnalysisResult;
  theme: ChartTheme;
}) {
  const caps = getChartCapabilities(analysis);
  const barRanking = pickBarRanking(analysis.rankings);
  const histograms = analysis.columns.filter((column) => column.type === "numeric").slice(0, MAX_HISTOGRAMS);
  const strongest = analysis.correlation?.strongest[0] ?? null;

  const barred = caps.bar && barRanking ? buildBarSpec(barRanking, theme) : null;
  const corr = caps.correlation && analysis.correlation ? buildCorrelationSpec(analysis.correlation, theme) : null;
  const line = caps.line && analysis.trend ? buildLineSpec(analysis.trend, theme) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {line && analysis.trend ? (
        <ChartCard
          title={`${analysis.trend.valueColumn} over time`}
          description={`Summed by ${analysis.trend.granularity} across “${analysis.trend.dateColumn}”.`}
          insight={
            <>
              Moved from <span className="text-foreground tnum">{formatNumber(analysis.trend.firstValue)}</span> (
              {analysis.trend.firstLabel}) to{" "}
              <span className="text-foreground tnum">{formatNumber(analysis.trend.lastValue)}</span> (
              {analysis.trend.lastLabel}) — {formatSignedPct(analysis.trend.deltaPct)}. These are totals,
              not per-row averages.
            </>
          }
        >
          <Plot spec={line} ariaLabel={`Line chart of ${analysis.trend.valueColumn} by ${analysis.trend.granularity}`} />
        </ChartCard>
      ) : (
        <ReasonCard title="Trend over time" reason={caps.reasons.line ?? "Not available for this dataset."} />
      )}

      {barred && barRanking ? (
        <ChartCard
          title={`${barRanking.column}${barRanking.metricColumn ? ` by ${barRanking.metricColumn}` : " by row count"}`}
          description="Top categories, ranked. Hover any bar for the exact value."
          insight={describeBarChart(barRanking)}
        >
          <Plot spec={barred} ariaLabel={`Bar chart of ${barRanking.column}`} />
        </ChartCard>
      ) : (
        <ReasonCard title="Category comparison" reason={caps.reasons.bar ?? "Not available for this dataset."} />
      )}

      {caps.histogram
        ? histograms.map((column) => {
            const summary = analysis.summaries.find((item) => item.column === column.name);
            const outlier = analysis.outliers.find((item) => item.column === column.name);
            if (!summary) return null;
            return (
              <ChartCard
                key={column.name}
                title={`Distribution of ${column.name}`}
                description="How often each value range occurs across all rows."
                insight={
                  <>
                    Mean <span className="text-foreground tnum">{formatNumber(summary.mean)}</span>, median{" "}
                    <span className="text-foreground tnum">{formatNumber(summary.median)}</span>, std{" "}
                    <span className="text-foreground tnum">{formatNumber(summary.std)}</span>.{" "}
                    {outlier && outlier.count > 0
                      ? `${outlier.count} value(s) sit outside ${formatNumber(outlier.lowerBound)} – ${formatNumber(outlier.upperBound)}.`
                      : "No values fall outside the 1.5×IQR fence."}
                  </>
                }
              >
                <Plot
                  spec={buildHistogramSpec(summary, column.numericValues, theme)}
                  ariaLabel={`Histogram of ${column.name}`}
                />
              </ChartCard>
            );
          })
        : null}

      {caps.correlation && corr ? (
        <ChartCard
          title="Correlation between numeric columns"
          description="Pearson r for each pair, using rows where both values are present."
          insight={
            strongest ? (
              <>
                Strongest relationship: <span className="text-foreground">{strongest.a}</span> and{" "}
                <span className="text-foreground">{strongest.b}</span> at r ={" "}
                <span className="text-foreground tnum">{formatNumber(strongest.r, 2)}</span> —{" "}
                {correlationStrength(strongest.r)} relationship. Correlation is not causation.
              </>
            ) : (
              "No pairs share enough complete rows to correlate."
            )
          }
        >
          <Plot spec={corr} ariaLabel="Correlation heatmap" />
        </ChartCard>
      ) : (
        <ReasonCard title="Correlation" reason={caps.reasons.correlation ?? "Not available for this dataset."} />
      )}
    </div>
  );
}
