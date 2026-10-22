import { Check, Loader2 } from "lucide-react";
import { Card } from "./ui";
import { cn } from "../lib/cn";

/** Staged progress for the analysis pipeline. Announces the active stage to AT. */
export function ProgressPanel({
  stage,
  stages,
}: {
  stage: number;
  stages: readonly string[];
}) {
  const current = Math.min(stage, stages.length - 1);
  const isComplete = stage >= stages.length;

  return (
    <Card className="p-6 rise-in">
      <div className="flex items-center gap-3">
        {isComplete ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-foreground">
          {isComplete ? "Analysis complete" : "Running analysis…"}
        </p>
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-4">
        {stages.map((label, index) => {
          const done = index < stage;
          const active = index === current && !isComplete;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium transition-colors duration-200",
                  done && "border-primary bg-primary text-on-primary",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div
        className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={stages.length}
        aria-valuenow={Math.min(stage, stages.length)}
        aria-label="Analysis progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${(Math.min(stage, stages.length) / stages.length) * 100}%` }}
        />
      </div>

      <p role="status" className="sr-only">
        {isComplete
          ? "Analysis complete."
          : `Stage ${current + 1} of ${stages.length}: ${stages[current]}.`}
      </p>
    </Card>
  );
}
