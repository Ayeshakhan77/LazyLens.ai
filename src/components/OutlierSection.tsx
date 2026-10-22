import type { OutlierResult } from "../types";
import { Callout } from "./ui";
import { formatNumber } from "../lib/format";

/**
 * Outlier summary from the IQR method. Reports which columns were checked and, where
 * values fell outside the fence, the exact bounds so the numbers can be verified.
 */
export function OutlierSection({ outliers }: { outliers: OutlierResult[] }) {
  if (outliers.length === 0) {
    return (
      <Callout tone="neutral" title="Not enough numeric data for outlier detection">
        Outlier detection needs a numeric column with at least 8 values so the quartiles are
        meaningful. This dataset doesn't have one.
      </Callout>
    );
  }

  const flagged = outliers.filter((result) => result.count > 0);

  if (flagged.length === 0) {
    return (
      <Callout tone="success" title="No numeric outliers detected">
        None of the {outliers.length} numeric column{outliers.length === 1 ? "" : "s"} checked
        contain values beyond 1.5×IQR from their quartiles.
      </Callout>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Outlier counts and IQR bounds per numeric column
          </caption>
          <thead className="bg-surface-2">
            <tr>
              {["Column", "Outliers", "Lower bound", "Upper bound", "Most extreme values"].map(
                (label, index) => (
                  <th
                    key={label}
                    scope="col"
                    className={
                      index === 0
                        ? "border-b border-border px-3 py-2.5 text-left font-medium text-foreground"
                        : "border-b border-border px-3 py-2.5 text-right font-medium text-foreground"
                    }
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {flagged.map((result) => {
              const extremes = [
                ...result.values.slice(0, 2),
                ...result.values.slice(-2),
              ].filter((value, index, all) => all.indexOf(value) === index);

              return (
                <tr key={result.column} className="border-b border-border/60 last:border-b-0">
                  <th
                    scope="row"
                    className="px-3 py-2.5 text-left font-normal text-foreground"
                  >
                    {result.column}
                  </th>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                    {formatNumber(result.count, 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatNumber(result.lowerBound)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatNumber(result.upperBound)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {extremes.map((value) => formatNumber(value)).join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
        Values outside 1.5×IQR from the quartiles. Verify them before trusting totals that
        include them — they are flagged, never removed.
      </p>
    </div>
  );
}
