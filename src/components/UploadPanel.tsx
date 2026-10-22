import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { BarChart3, FileSpreadsheet, Gauge, Sparkles, UploadCloud } from "lucide-react";
import { Button, Card, Callout } from "./ui";
import { cn } from "../lib/cn";
import { formatBytes } from "../lib/format";
import { MAX_FILE_BYTES } from "../data/parseCsv";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Drop in a CSV",
    body: "Your file is parsed in the browser. Raw rows never leave your device.",
  },
  {
    icon: Gauge,
    title: "We profile & verify",
    body: "Deterministic code checks types, missing values, duplicates and outliers — no guessing.",
  },
  {
    icon: BarChart3,
    title: "You get the story",
    body: "Interactive charts, rankings and an AI-written summary grounded in the computed numbers.",
  },
];

export function UploadPanel({
  onFile,
  onSample,
  busy,
}: {
  onFile: (file: File) => void;
  onSample: () => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    // allow re-selecting the same file after an error
    event.target.value = "";
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="text-center rise-in">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Turn a raw CSV into an insight report
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          LazyLens profiles your data, checks its quality, computes real statistics and charts,
          then asks an open-weight model to explain what it all means — using only the numbers
          we computed.
        </p>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="mt-8"
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200 ease-out",
            "active:scale-[0.99] disabled:cursor-wait disabled:opacity-70",
            dragging
              ? "border-primary bg-primary/8"
              : "border-border bg-surface hover:border-primary/60 hover:bg-surface-2",
          )}
        >
          <span
            className={cn(
              "grid size-12 place-items-center rounded-full transition-colors",
              dragging ? "bg-primary text-on-primary" : "bg-muted text-muted-foreground group-hover:text-primary",
            )}
          >
            <FileSpreadsheet className="size-6" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-foreground">
            {dragging ? "Drop your CSV to begin" : "Click to choose a CSV, or drag one here"}
          </span>
          <span className="text-xs text-muted-foreground">
            CSV only · up to {formatBytes(MAX_FILE_BYTES)} · parsed locally in your browser
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onInputChange}
          className="sr-only"
          aria-label="Choose a CSV file"
        />
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-px w-8 bg-border" aria-hidden="true" />
          or
          <span className="h-px w-8 bg-border" aria-hidden="true" />
        </div>
        <Button variant="secondary" onClick={onSample} disabled={busy}>
          <Sparkles className="size-4" aria-hidden="true" />
          Load the sample dataset
        </Button>
        <p className="max-w-md text-center text-xs text-muted-foreground">
          A bundled retail-sales CSV with real messiness in it — missing values, duplicates and
          a constant column — so you can see every feature working.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title} as="div" className="p-4">
            <step.icon className="size-4 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-foreground">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
          </Card>
        ))}
      </div>

      <Callout tone="info" className="mt-6" title="What leaves your browser">
        Parsing, profiling and charts run entirely on your device, and your raw rows are never
        uploaded. If you use the AI features, only a compact summary of the computed statistics
        is sent for interpretation.
      </Callout>
    </div>
  );
}
