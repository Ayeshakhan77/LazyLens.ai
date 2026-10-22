import { type ChangeEvent, useRef } from "react";
import { AlertTriangle, Loader2, Play, Upload, X } from "lucide-react";
import { Button, Callout, Card, Skeleton } from "./ui";
import type { ParsedCsv } from "../types";
import type { UiError } from "../state/useAnalysis";
import { formatNumber } from "../lib/format";

/** Hidden-input file picker so any surface can offer (re)upload. */
export function FilePicker({
  onFile,
  label,
  variant = "secondary",
}: {
  onFile: (file: File) => void;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  };

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" aria-hidden="true" />
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onChange}
        className="sr-only"
        aria-label={label}
      />
    </>
  );
}

export function DatasetHeader({ parsed }: { parsed: ParsedCsv }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Dataset
        </p>
        <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">
          {parsed.fileName}
        </h1>
        <p className="mt-1 text-sm tabular-nums text-muted-foreground">
          {formatNumber(parsed.rowCount, 0)} rows · {formatNumber(parsed.headers.length, 0)} columns
          {parsed.repairs.length > 0
            ? ` · ${formatNumber(parsed.repairs.length, 0)} header${
                parsed.repairs.length === 1 ? "" : "s"
              } repaired`
            : ""}
        </p>
      </div>
    </div>
  );
}

export function ErrorBanner({ error, onDismiss }: { error: UiError; onDismiss: () => void }) {
  return (
    <div role="alert" className="mt-6">
      <Callout tone="danger" title={error.title} icon={false}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p className="flex-1 leading-relaxed">{error.message}</p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss this message"
            className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </Callout>
    </div>
  );
}

export function LoadingPanel({ label = "Reading your CSV…" }: { label?: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
      <p role="status" className="text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function RunAnalysisCallout({ onRun, busy }: { onRun: () => void; busy: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground">Ready to analyse</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            We'll compute descriptive statistics, detect outliers, rank your categories and build
            the charts that this data actually supports. The numbers are all calculated locally.
          </p>
        </div>
        <Button onClick={onRun} disabled={busy} className="shrink-0">
          <Play className="size-4" aria-hidden="true" />
          Run analysis
        </Button>
      </div>
    </Card>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </div>
  );
}
