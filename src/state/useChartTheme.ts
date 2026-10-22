import { useEffect, useState } from "react";
import { type ChartTheme, readChartTheme } from "../charts/theme";
import { useTheme } from "./theme";

/**
 * Chart colours must be sampled from the DOM *after* the theme class has been applied,
 * otherwise charts render one theme behind. Reading inside a rAF callback guarantees
 * the stylesheet has settled.
 */
export function useChartTheme(): ChartTheme {
  const { theme } = useTheme();
  const [chartTheme, setChartTheme] = useState<ChartTheme>(readChartTheme);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setChartTheme(readChartTheme()));
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  return chartTheme;
}
