import { useEffect, useRef } from "react";
import Plotly from "plotly.js-cartesian-dist-min";
import { cn } from "../lib/cn";
import type { ChartSpec } from "../charts/buildChartSpecs";

const CONFIG = {
  displayModeBar: false,
  displaylogo: false,
  responsive: true,
};

/**
 * Thin Plotly wrapper around the slim bundle.
 *
 * `Plotly.react` diffs and updates in place, so re-rendering with a new theme is cheap
 * and there is no flicker. The element is purged exactly once on unmount.
 */
export function Plot({
  spec,
  className,
  ariaLabel,
}: {
  spec: ChartSpec;
  className?: string;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    void Plotly.react(element, spec.data, spec.layout, CONFIG).catch(() => {
      /* a failed plot leaves the surrounding card intact */
    });
  }, [spec]);

  useEffect(() => {
    const element = containerRef.current;
    return () => {
      if (element) Plotly.purge(element);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={cn("w-full", className)}
    />
  );
}

/** Grab a chart as a PNG data URL — used by the report exporter. */
export async function plotElementToImage(
  element: HTMLElement,
  width = 900,
  height = 420,
): Promise<string | null> {
  try {
    return await Plotly.toImage(element, { format: "png", width, height, scale: 2 });
  } catch {
    return null;
  }
}
