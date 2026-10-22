/**
 * Minimal, self-contained typings for the slim Plotly *cartesian* bundle.
 *
 * We render Plotly through a tiny React wrapper (see components/Plot.tsx) instead of
 * `react-plotly.js` so we can use the much smaller `plotly.js-cartesian-dist-min` build
 * (scatter / bar / histogram / heatmap — everything this app plots) and avoid that
 * package's React peer range. The chart specs themselves are typed loosely so no module
 * other than the wrapper needs to know Plotly exists — which also keeps `charts/` free of
 * a Plotly dependency.
 */
declare module "plotly.js-cartesian-dist-min" {
  export type PlotlyTrace = Record<string, unknown>;
  export type PlotlyLayout = Record<string, unknown>;
  export type PlotlyConfig = Record<string, unknown>;

  export interface PlotlyLike {
    react: (
      el: HTMLElement,
      data: PlotlyTrace[],
      layout?: PlotlyLayout,
      config?: PlotlyConfig,
    ) => Promise<unknown>;
    purge: (el: HTMLElement) => void;
    toImage: (
      el: HTMLElement,
      opts?: { format?: string; width?: number; height?: number; scale?: number },
    ) => Promise<string>;
    Plots: { resize: (el: HTMLElement) => void };
  }

  const Plotly: PlotlyLike;
  export default Plotly;
}
