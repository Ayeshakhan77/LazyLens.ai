import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Card } from "./ui";
import { cn } from "../lib/cn";

/** A chart card: title, plain-language description, the plot, and an insight caption. */
export function ChartCard({
  title,
  description,
  insight,
  children,
  className,
}: {
  title: string;
  description?: string;
  insight?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="mt-4 flex-1">{children}</div>
      {insight ? (
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          {insight}
        </p>
      ) : null}
    </Card>
  );
}

/** Shown instead of a blank chart when a chart is not statistically appropriate. */
export function ReasonCard({
  title,
  reason,
  className,
}: {
  title: string;
  reason: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 px-4 py-10 text-center">
        <Info className="size-4 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">{reason}</p>
      </div>
    </Card>
  );
}
