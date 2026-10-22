import { useState } from "react";
import type { RankingResult } from "../types";
import { Callout, Card } from "./ui";
import { formatNumber, formatRatio } from "../lib/format";

const COLLAPSED_COUNT = 6;

function RankingCard({ ranking }: { ranking: RankingResult }) {
  const [expanded, setExpanded] = useState(false);
  const entries = expanded ? ranking.entries : ranking.entries.slice(0, COLLAPSED_COUNT);

  const metric = ranking.metricColumn;
  const values = entries.map((entry) => (metric ? (entry.sum ?? 0) : entry.count));
  const maxValue = Math.max(...values, 1);

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{ranking.column}</h3>
        <span className="text-[11px] text-muted-foreground">
          {metric ? `ranked by total ${metric}` : "ranked by row count"}
        </span>
      </div>

      <ol className="mt-4 flex-1 space-y-2.5">
        {entries.map((entry, index) => {
          const value = metric ? (entry.sum ?? 0) : entry.count;
          return (
            <li key={entry.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="truncate text-sm text-foreground" title={entry.key}>
                  {entry.key}
                </span>
              </div>
              <span className="text-sm tabular-nums text-foreground">
                {formatNumber(value, metric ? 2 : 0)}
              </span>
              <div className="col-span-2 flex items-center gap-2 pl-6">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.max(2, (value / maxValue) * 100)}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  {formatRatio(entry.share)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {ranking.entries.length > COLLAPSED_COUNT ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-4 cursor-pointer self-start rounded-md text-xs font-medium text-primary transition-colors hover:bg-primary/10 px-2 py-1"
        >
          {expanded
            ? "Show fewer"
            : `Show all ${ranking.entries.length} categories`}
        </button>
      ) : null}
    </Card>
  );
}

export function RankingsSection({ rankings }: { rankings: RankingResult[] }) {
  if (rankings.length === 0) {
    return (
      <Callout tone="neutral" title="Nothing to rank">
        This dataset has no categorical columns with a manageable number of distinct values, so
        there is no breakdown to show. Columns with hundreds of unique values (like IDs) are
        deliberately skipped — they are not useful groupings.
      </Callout>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rankings.slice(0, 4).map((ranking) => (
        <RankingCard key={ranking.column} ranking={ranking} />
      ))}
    </div>
  );
}
