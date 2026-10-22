import { lazy, Suspense } from "react";
import { ThemeProvider } from "./state/theme";
import { ANALYSIS_STAGES, useAnalysis } from "./state/useAnalysis";
import { useChartTheme } from "./state/useChartTheme";
import { TopBar } from "./components/TopBar";
import { UploadPanel } from "./components/UploadPanel";
import { PreviewTable } from "./components/PreviewTable";
import { QualityReport } from "./components/QualityReport";
import { KpiCards } from "./components/KpiCards";
import { RankingsSection } from "./components/RankingsSection";
import { OutlierSection } from "./components/OutlierSection";
import { ProgressPanel } from "./components/ProgressPanel";
import { SectionHeading } from "./components/ui";
import {
  DatasetHeader,
  ErrorBanner,
  FilePicker,
  LoadingPanel,
  ResultsSkeleton,
  RunAnalysisCallout,
} from "./components/ResultShell";

/**
 * Plotly is heavy and the upload screen never needs it, so the chart grid is a separate
 * chunk pulled in only once an analysis is ready.
 */
const AnalysisCharts = lazy(() =>
  import("./components/AnalysisCharts").then((module) => ({
    default: module.AnalysisCharts,
  })),
);

function AppInner() {
  const { state, busy, loadFile, loadSample, analyze, reset, dismissError } = useAnalysis();
  const chartTheme = useChartTheme();

  const { phase, parsed, profiles, quality, analysis, error, stage } = state;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-primary"
      >
        Skip to content
      </a>

      <TopBar onReset={reset} canReset={phase !== "idle"} />

      <main id="main-content" tabIndex={-1} className="flex-1">
        {parsed === null ? (
          phase === "loading" ? (
            <LoadingPanel />
          ) : (
            <>
              {error ? (
                <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
                  <ErrorBanner error={error} onDismiss={dismissError} />
                </div>
              ) : null}
              <UploadPanel onFile={loadFile} onSample={loadSample} busy={busy} />
            </>
          )
        ) : (
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
            <DatasetHeader parsed={parsed} />
            {error ? <ErrorBanner error={error} onDismiss={dismissError} /> : null}

            <section aria-labelledby="overview-heading">
              <SectionHeading
                id="overview-heading"
                title="Preview"
                description="The first rows of your file, with each column's detected type, missing count and distinct values. Click a column header to sort."
                actions={<FilePicker onFile={loadFile} label="Replace CSV" />}
              />
              {profiles ? (
                <PreviewTable headers={parsed.headers} rows={parsed.rows} profiles={profiles} />
              ) : null}
            </section>

            <section aria-labelledby="quality-heading">
              <SectionHeading
                id="quality-heading"
                title="Data quality"
                description="Automatic checks across every column. Each finding shows what was observed and a suggested next step — nothing is changed for you."
              />
              {quality ? <QualityReport issues={quality} /> : null}
            </section>

            {phase === "preview" ? <RunAnalysisCallout onRun={analyze} busy={busy} /> : null}

            {phase === "analyzing" || phase === "ready" ? (
              <section aria-labelledby="analysis-heading" className="space-y-8">
                <SectionHeading
                  id="analysis-heading"
                  title="Analysis"
                  description="Descriptive statistics, capability-gated charts, category rankings and outlier detection — all computed from your data."
                />

                {phase === "analyzing" ? (
                  <div className="space-y-6">
                    <ProgressPanel stage={stage} stages={ANALYSIS_STAGES} />
                    <ResultsSkeleton />
                  </div>
                ) : analysis ? (
                  <div className="space-y-8 rise-in">
                    <KpiCards analysis={analysis} />

                    <div>
                      <SectionHeading
                        level={3}
                        title="Charts"
                        description="Only the charts this dataset supports appear. Where one isn't statistically appropriate, we explain why instead."
                      />
                      <Suspense fallback={<ResultsSkeleton />}>
                        <AnalysisCharts analysis={analysis} theme={chartTheme} />
                      </Suspense>
                    </div>

                    <div>
                      <SectionHeading
                        level={3}
                        title="Rankings & breakdowns"
                        description="Top categories, ranked by total or row count. ID-like columns with hundreds of values are skipped."
                      />
                      <RankingsSection rankings={analysis.rankings} />
                    </div>

                    <div>
                      <SectionHeading
                        level={3}
                        title="Outlier summary"
                        description="Values beyond 1.5×IQR from each numeric column's quartiles."
                      />
                      <OutlierSection outliers={analysis.outliers} />
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </main>

      <footer className="border-t border-border px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>LazyLens AI · Parsing, profiling and charts run entirely in your browser.</span>
          <span>Raw rows never leave your device.</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
