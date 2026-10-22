import type { ButtonHTMLAttributes, ElementType, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "../lib/cn";
import type { Severity } from "../types";

/* ------------------------------------------------------------------ Card --- */

export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag className={cn("rounded-xl border border-border bg-surface shadow-sm", className)}>
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- Button --- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
};

const BUTTON_VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover border border-transparent font-medium",
  secondary:
    "bg-surface text-foreground border border-border hover:border-primary/60 hover:text-primary",
  ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg transition-all duration-200 ease-out",
        "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        size === "md" ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------ Chip --- */

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "border-destructive/35 bg-destructive/12 text-destructive",
  warning: "border-warning/35 bg-warning/14 text-warning",
  info: "border-info/35 bg-info/12 text-info",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        SEVERITY_STYLES[severity],
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function TypeChip({ type }: { type: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {type}
    </span>
  );
}

/* --------------------------------------------------------------- Callout --- */

type CalloutTone = "neutral" | "info" | "warning" | "danger" | "success";

const CALLOUT_STYLES: Record<CalloutTone, string> = {
  neutral: "border-border bg-surface-2 text-muted-foreground",
  info: "border-info/30 bg-info/10 text-foreground",
  warning: "border-warning/35 bg-warning/10 text-foreground",
  danger: "border-destructive/35 bg-destructive/10 text-foreground",
  success: "border-success/35 bg-success/10 text-foreground",
};

const CALLOUT_ICONS: Record<CalloutTone, ElementType> = {
  neutral: Info,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
  success: CheckCircle2,
};

export function Callout({
  tone = "neutral",
  title,
  children,
  className,
  icon = true,
}: {
  tone?: CalloutTone;
  title?: string;
  children?: ReactNode;
  className?: string;
  icon?: boolean;
}) {
  const Icon = CALLOUT_ICONS[tone];
  return (
    <div className={cn("flex gap-3 rounded-lg border p-4", CALLOUT_STYLES[tone], className)}>
      {icon ? (
        <Icon
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-4 shrink-0",
            tone === "danger" && "text-destructive",
            tone === "warning" && "text-warning",
            tone === "info" && "text-info",
            tone === "success" && "text-success",
            tone === "neutral" && "text-muted-foreground",
          )}
        />
      ) : null}
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title ? <p className="font-medium text-foreground">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1", "text-muted-foreground")}>{children}</div> : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Skeleton --- */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-md", className)} />;
}

/* ------------------------------------------------------- SectionHeading --- */

export function SectionHeading({
  title,
  description,
  id,
  actions,
  level = 2,
}: {
  title: string;
  description?: string;
  id?: string;
  actions?: ReactNode;
  level?: 2 | 3;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", level === 3 && "mb-3")}>
      <div className="min-w-0">
        <Tag
          id={id}
          className={cn(
            "font-semibold tracking-tight text-foreground",
            level === 2 ? "text-lg" : "text-sm",
          )}
        >
          {title}
        </Tag>
        {description ? (
          <p
            className={cn(
              "mt-1 max-w-3xl text-muted-foreground",
              level === 2 ? "text-sm" : "text-xs",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
