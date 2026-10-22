import { CheckCircle2, Lightbulb } from "lucide-react";
import type { QualityIssue } from "../types";
import { countBySeverity } from "../analysis/quality";
import { Callout, Card, SeverityChip, TypeChip } from "./ui";
import { cn } from "../lib/cn";

const CATEGORY_LABELS: Record<QualityIssue["category"], string> = {
  "header-repair": "Header",
  missing: "Missing data",
  "duplicate-rows": "Duplicates",
  constant: "Constant",
  "mixed-type": "Types",
  "empty-column": "Empty",
  outlier: "Outliers",
};

export function QualityReport({ issues }: { issues: QualityIssue[] }) {
  const counts = countBySeverity(issues);

  if (issues.length === 0) {
    return (
      <Callout
        tone="success"
        title="No data-quality issues found"
        icon={false}
        className="items-start"
      >
        <span className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <span>
            Every column has values, there are no duplicate rows, no constant columns and no
            mixed types. Nothing to fix before you analyse.
          </span>
        </span>
      </Callout>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {issues.length} finding{issues.length === 1 ? "" : "s"}:
        </span>
        {(["critical", "warning", "info"] as const).map((severity) =>
          counts[severity] > 0 ? (
            <span key={severity} className="inline-flex items-center gap-1.5">
              <SeverityChip severity={severity} />
              <span className="text-xs tabular-nums text-muted-foreground">{counts[severity]}</span>
            </span>
          ) : null,
        )}
      </div>

      <ul className="grid gap-2.5">
        {issues.map((issue) => (
          <li key={issue.id}>
            <Card as="div" className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityChip severity={issue.severity} />
                <span className="text-sm font-medium text-foreground">{issue.title}</span>
                {issue.column ? (
                  <span className="inline-flex items-center gap-1.5">
                    <TypeChip type={CATEGORY_LABELS[issue.category]} />
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground">
                      {issue.column}
                    </code>
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{issue.observed}</p>
              <p
                className={cn(
                  "mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground",
                )}
              >
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  <span className="font-medium text-foreground">Suggested next step: </span>
                  {issue.recommendation}
                </span>
              </p>
            </Card>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        Suggestions are advisory. LazyLens never modifies or cleans your dataset — you stay in
        control of the original file.
      </p>
    </div>
  );
}
