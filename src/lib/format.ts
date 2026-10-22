const DASH = "—";

/** Fixed 2-dp-ish number with thousands separators, up to `maxFrac` decimals. */
export function formatNumber(value: number | null | undefined, maxFrac = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(value);
}

/** Compact form for KPI tiles: 12.4K, 1.2M. */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  const abs = Math.abs(value);
  if (abs < 1000) return formatNumber(value, abs < 10 ? 2 : 0);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRatio(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  return `${formatNumber(value * 100, digits)}%`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return DASH;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${formatNumber(value, value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** 0.1234 -> "+12.3%" (signed, for trend deltas). */
export function formatSignedPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value * 100, digits)}%`;
}

export function truncate(value: string, max = 40): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
