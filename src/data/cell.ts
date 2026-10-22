/**
 * Cell-level parsing helpers. Pure, dependency-free.
 */

const MISSING_TOKENS = new Set([
  "",
  "na",
  "n/a",
  "null",
  "nan",
  "none",
  "nil",
  "undefined",
  "(null)",
  "-",
  "--",
]);

/** True when a raw cell should be treated as absent. */
export function isMissing(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) return true;
  const value = String(raw).trim();
  return value === "" || MISSING_TOKENS.has(value.toLowerCase());
}

const NUMERIC_RE = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

/**
 * Parse a cell to a number, tolerating thousands separators and a leading currency
 * symbol. Returns null for anything that is not genuinely a single number.
 */
export function toNumber(raw: string | null | undefined): number | null {
  if (isMissing(raw)) return null;
  const cleaned = String(raw)
    .trim()
    .replace(/,/g, "")
    .replace(/^\$/, "")
    .trim();
  if (cleaned === "" || !NUMERIC_RE.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

const ISO_DATE_RE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
const US_DATE_RE = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
const YEAR_MONTH_RE = /^(\d{4})[-/](\d{1,2})$/;

function build(y: number, m: number, d: number): Date | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) return null;
  // Reject roll-overs like 2025-02-31.
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

/**
 * Parse a cell to a Date when it is *unambiguously* date-like. Numbers (including bare
 * years) deliberately return null so numeric columns are never mistaken for dates.
 */
export function parseDate(raw: string | null | undefined): Date | null {
  if (isMissing(raw)) return null;
  const value = String(raw).trim();
  if (toNumber(value) !== null) return null;

  let match = ISO_DATE_RE.exec(value);
  if (match) return build(Number(match[1]), Number(match[2]), Number(match[3]));

  match = US_DATE_RE.exec(value);
  if (match) return build(Number(match[3]), Number(match[1]), Number(match[2]));

  match = YEAR_MONTH_RE.exec(value);
  if (match) return build(Number(match[1]), Number(match[2]), 1);

  // Anything without an explicit separator or a month name is not treated as a date.
  if (!/[\/\-:\s]/.test(value) && !/[a-z]{3,}/i.test(value)) return null;

  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  const date = new Date(time);
  const year = date.getUTCFullYear();
  if (year < 1900 || year > 2200) return null;
  return date;
}

export function isMissingToken(raw: string): boolean {
  return MISSING_TOKENS.has(raw.trim().toLowerCase());
}
