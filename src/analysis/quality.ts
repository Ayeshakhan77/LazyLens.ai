import type { ColumnProfile, HeaderRepair, QualityIssue, Severity } from "../types";
import { formatNumber, formatRatio } from "../lib/format";
import { findOutliers } from "./outliers";

export interface QualityInput {
  rowCount: number;
  repairs: HeaderRepair[];
  columns: ColumnProfile[];
  /** Raw rows — needed for exact-duplicate detection. */
  rows: string[][];
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

/** Deterministic data-quality findings. Never mutates the input dataset. */
export function analyzeQuality(input: QualityInput): QualityIssue[] {
  const issues: QualityIssue[] = [];

  for (const repair of input.repairs) {
    issues.push({
      id: `header-${repair.index}`,
      severity: "warning",
      category: "header-repair",
      column: repair.normalized,
      title: repair.reason === "blank" ? "Blank column header" : "Duplicate column header",
      observed:
        repair.reason === "blank"
          ? `Column ${repair.index + 1} had no header text, so it was named "${repair.normalized}".`
          : `The header "${repair.original}" appeared more than once; the repeat was named "${repair.normalized}".`,
      recommendation:
        "Rename this column in the source file so it is unambiguous before you rely on it.",
    });
  }

  const seen = new Map<string, number>();
  let duplicates = 0;
  for (const row of input.rows) {
    const key = row.join("\u0001");
    const count = seen.get(key) ?? 0;
    if (count > 0) duplicates += 1;
    seen.set(key, count + 1);
  }
  if (duplicates > 0) {
    const pct = input.rowCount > 0 ? duplicates / input.rowCount : 0;
    issues.push({
      id: "duplicate-rows",
      severity: pct >= 0.05 ? "critical" : "warning",
      category: "duplicate-rows",
      title: "Duplicate rows",
      observed: `${duplicates} of ${input.rowCount} rows (${formatRatio(pct)}) are exact duplicates of an earlier row.`,
      recommendation:
        "Check whether these are double entries. LazyLens reports them but never deletes rows for you.",
    });
  }

  for (const profile of input.columns) {
    const nonMissing = profile.total - profile.missing;

    if (profile.total > 0 && nonMissing === 0) {
      issues.push({
        id: `empty-${profile.index}`,
        severity: "critical",
        category: "empty-column",
        column: profile.name,
        title: "Empty column",
        observed: `"${profile.name}" has no values in any of the ${profile.total} rows.`,
        recommendation: "Drop the column, or check that it was exported with data.",
      });
      continue;
    }

    if (profile.missing > 0) {
      const pct = profile.missing / profile.total;
      const severity: Severity = pct >= 0.5 ? "critical" : pct >= 0.1 ? "warning" : "info";
      issues.push({
        id: `missing-${profile.index}`,
        severity,
        category: "missing",
        column: profile.name,
        title: "Missing values",
        observed: `"${profile.name}" is missing ${profile.missing} of ${profile.total} values (${formatRatio(pct)}).`,
        recommendation:
          pct >= 0.5
            ? "Too sparse to rely on — consider excluding it or investigating the source."
            : "Decide whether affected rows should be excluded from calculations.",
      });
    }

    if (profile.type !== "empty" && profile.distinct === 1) {
      issues.push({
        id: `constant-${profile.index}`,
        severity: "info",
        category: "constant",
        column: profile.name,
        title: "Constant column",
        observed: `"${profile.name}" holds the same value ("${profile.topValues[0]?.value ?? ""}") in every non-missing row.`,
        recommendation: "It carries no signal, so it is safe to drop. LazyLens left it untouched.",
      });
    }

    const numericMixed = profile.numericRatio >= 0.5 && profile.numericRatio < 0.9;
    const dateMixed = profile.dateRatio >= 0.5 && profile.dateRatio < 0.9;
    if (nonMissing >= 8 && profile.type !== "numeric" && (numericMixed || dateMixed)) {
      issues.push({
        id: `mixed-${profile.index}`,
        severity: "warning",
        category: "mixed-type",
        column: profile.name,
        title: "Mixed types",
        observed: `"${profile.name}" is ${formatRatio(profile.numericRatio)} numeric and ${formatRatio(profile.dateRatio)} date-like; the rest is text.`,
        recommendation: "Standardize the format so the column can be analysed consistently.",
      });
    }

    if (profile.type === "numeric") {
      const result = findOutliers(profile.name, profile.numericValues);
      if (result && result.count > 0) {
        const share = result.count / profile.numericValues.length;
        issues.push({
          id: `outlier-${profile.index}`,
          severity: share >= 0.05 ? "warning" : "info",
          category: "outlier",
          column: profile.name,
          title: "Outlier values",
          observed: `${result.count} value${result.count === 1 ? "" : "s"} in "${profile.name}" fall outside ${formatNumber(result.lowerBound)} – ${formatNumber(result.upperBound)} (1.5×IQR).`,
          recommendation:
            "Confirm these aren't data-entry errors before trusting totals that include them.",
        });
      }
    }
  }

  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function countBySeverity(issues: QualityIssue[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, warning: 0, info: 0 };
  for (const issue of issues) counts[issue.severity] += 1;
  return counts;
}
