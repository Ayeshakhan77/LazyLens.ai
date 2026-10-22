/**
 * Plotly cannot read CSS custom properties, so we sample the live theme tokens and
 * hand them to every chart spec. Re-read on theme change so charts follow the toggle.
 */
export interface ChartTheme {
  foreground: string;
  muted: string;
  grid: string;
  surface: string;
  border: string;
  /** Categorical series colors, in order. */
  series: string[];
}

const FALLBACK: ChartTheme = {
  foreground: "#1b1a18",
  muted: "#6b6560",
  grid: "#e3dfd9",
  surface: "#ffffff",
  border: "#e3dfd9",
  series: ["#8c1d2b", "#b06a2c", "#3f5f8a", "#2f7d55", "#7a5c86", "#8a7a56"],
};

export function readChartTheme(): ChartTheme {
  if (typeof window === "undefined" || typeof document === "undefined") return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const value = styles.getPropertyValue(name).trim();
    return value === "" ? fallback : value;
  };

  return {
    foreground: read("--foreground", FALLBACK.foreground),
    muted: read("--muted-foreground", FALLBACK.muted),
    grid: read("--grid", FALLBACK.grid),
    surface: read("--surface", FALLBACK.surface),
    border: read("--border", FALLBACK.border),
    series: [1, 2, 3, 4, 5, 6].map((index) =>
      read(`--chart-${index}`, FALLBACK.series[(index - 1) % FALLBACK.series.length]),
    ),
  };
}

export function seriesColor(theme: ChartTheme, index: number): string {
  return theme.series[index % theme.series.length];
}
