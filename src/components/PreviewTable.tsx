import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ColumnProfile } from "../types";
import { isMissing, toNumber } from "../data/cell";
import { cn } from "../lib/cn";
import { TypeChip } from "./ui";
import { formatNumber } from "../lib/format";

const PAGE_SIZE = 20;

type SortState = { index: number; dir: "asc" | "desc" } | null;

/**
 * First N rows of the dataset with per-column type / missing / distinct context.
 * Columns are sortable (header click) and the header row sticks while scrolling.
 */
export function PreviewTable({
  headers,
  rows,
  profiles,
}: {
  headers: string[];
  rows: string[][];
  profiles: ColumnProfile[];
}) {
  const [sort, setSort] = useState<SortState>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const numericFlags = useMemo(
    () => profiles.map((profile) => profile.type === "numeric"),
    [profiles],
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { index, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;
    const isNumeric = numericFlags[index];

    return [...rows].sort((a, b) => {
      const left = a[index] ?? "";
      const right = b[index] ?? "";
      const leftMissing = isMissing(left);
      const rightMissing = isMissing(right);
      // Missing values always sort last, regardless of direction.
      if (leftMissing && rightMissing) return 0;
      if (leftMissing) return 1;
      if (rightMissing) return -1;

      if (isNumeric) {
        const leftNumber = toNumber(left);
        const rightNumber = toNumber(right);
        if (leftNumber !== null && rightNumber !== null) {
          return (leftNumber - rightNumber) * factor;
        }
      }
      return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }) * factor;
    });
  }, [rows, sort, numericFlags]);

  const visible = sortedRows.slice(0, limit);
  const canShowMore = limit < sortedRows.length;

  const toggleSort = (index: number) => {
    setSort((current) => {
      if (!current || current.index !== index) return { index, dir: "asc" };
      if (current.dir === "asc") return { index, dir: "desc" };
      return null;
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="scroll-thin max-h-[520px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Preview of the uploaded dataset: {formatNumber(rows.length, 0)} rows and{" "}
            {formatNumber(headers.length, 0)} columns
          </caption>
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr>
              {headers.map((header, index) => {
                const profile = profiles[index];
                const active = sort?.index === index;
                const ariaSort = active
                  ? sort.dir === "asc"
                    ? ("ascending" as const)
                    : ("descending" as const)
                  : ("none" as const);

                return (
                  <th
                    key={`${header}-${index}`}
                    scope="col"
                    aria-sort={ariaSort}
                    className="border-b border-border px-3 py-2 text-left align-bottom"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(index)}
                      className="group flex w-full cursor-pointer items-center gap-1.5 rounded text-left transition-colors hover:text-primary"
                      title={`Sort by ${header}`}
                    >
                      <span className="truncate font-medium text-foreground group-hover:text-primary">
                        {header}
                      </span>
                      {active ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="size-3 shrink-0 text-primary" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3 shrink-0 text-primary" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown
                          className="size-3 shrink-0 text-muted-foreground/50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {profile ? <TypeChip type={profile.type} /> : null}
                    </div>
                    {profile ? (
                      <div className="mt-1 whitespace-nowrap text-[11px] font-normal text-muted-foreground">
                        {profile.missing > 0 ? `${profile.missing} missing · ` : ""}
                        {profile.distinct} distinct
                      </div>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-surface-2"
              >
                {headers.map((header, columnIndex) => {
                  const value = row[columnIndex] ?? "";
                  const missing = isMissing(value);
                  return (
                    <td
                      key={`${header}-${columnIndex}`}
                      className={cn(
                        "max-w-[22rem] truncate px-3 py-2 align-top",
                        numericFlags[columnIndex] && "text-right tnum",
                        missing && "text-muted-foreground/60",
                      )}
                    >
                      {missing ? "—" : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-3 py-2.5">
        <p className="text-xs text-muted-foreground">
          Showing {formatNumber(Math.min(limit, sortedRows.length), 0)} of{" "}
          {formatNumber(sortedRows.length, 0)} rows
          {sort ? ` · sorted by “${headers[sort.index]}” ${sort.dir}` : ""}
        </p>
        {canShowMore ? (
          <button
            type="button"
            onClick={() => setLimit((current) => current + PAGE_SIZE)}
            className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Show {Math.min(PAGE_SIZE, sortedRows.length - limit)} more rows
          </button>
        ) : null}
      </div>
    </div>
  );
}
