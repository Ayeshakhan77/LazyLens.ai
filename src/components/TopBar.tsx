import { Moon, RotateCcw, ScanSearch, Sun } from "lucide-react";
import { Button } from "./ui";
import { useTheme } from "../state/theme";

export function TopBar({ onReset, canReset }: { onReset: () => void; canReset: boolean }) {
  const { theme, toggle } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-on-primary">
            <ScanSearch className="size-4" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-foreground">LazyLens AI</p>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Upload Data. Get Insights. Skip the Boring Work.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            aria-label={`Switch to ${nextTheme} theme`}
          >
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </Button>
          <Button variant="secondary" size="sm" onClick={onReset} disabled={!canReset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            New analysis
          </Button>
        </div>
      </div>
    </header>
  );
}
