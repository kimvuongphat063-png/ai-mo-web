import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Studio workspace UI primitives — Linear/Notion/Vercel style.        */
/* Tokens: bg, surface, surface-2, border, border-2, text, text-2,     */
/* muted, accent, accent-subtle, success/warning/error (+ -subtle).    */
/* See docs/UI-REDESIGN-PLAN.md.                                       */
/* ------------------------------------------------------------------ */

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------ Spinner ---------------------------- */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("h-4 w-4 animate-spin", className)} aria-hidden />;
}

/* ------------------------------ Button ----------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover disabled:hover:bg-accent",
  secondary:
    "bg-surface text-text border border-border hover:bg-surface-2 disabled:hover:bg-surface",
  ghost: "text-text-2 hover:bg-surface-2 hover:text-text",
  danger: "bg-error text-white hover:bg-red-700 disabled:hover:bg-error",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className,
  style,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        size === "sm" ? "h-8 px-3" : "h-9 px-4",
        buttonVariants[variant],
        className
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  style,
}: {
  children: React.ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href={href}
      style={style}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
        size === "sm" ? "h-8 px-3" : "h-9 px-4",
        buttonVariants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

/* ------------------------------ Badge ------------------------------ */

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "error";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text-2",
  accent: "bg-accent-subtle text-accent",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  error: "bg-error-subtle text-error",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Panel ------------------------------ */

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-lg border border-border bg-surface", className)}>
      {(title || actions) && (
        <header className="flex h-12 items-center justify-between gap-3 border-b border-border px-4">
          {title && <h2 className="text-sm font-medium text-text">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

/* ---------------------------- PageHeader ---------------------------- */

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-text"
        >
          ← {backLabel || "Back"}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-text">{title}</h1>
          {description && <p className="mt-1 text-sm text-text-2">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ------------------------------ Stat ------------------------------- */

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/* ---------------------------- EmptyState ---------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center justify-center py-12 text-center", className)}>
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
          <Icon className="h-5 w-5 text-muted" />
        </div>
      )}
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------ Alert ------------------------------ */

type AlertTone = "error" | "warning" | "success" | "info";

const alertTones: Record<AlertTone, { box: string; icon: LucideIcon }> = {
  error: { box: "bg-error-subtle text-error", icon: AlertCircle },
  warning: { box: "bg-warning-subtle text-warning", icon: AlertTriangle },
  success: { box: "bg-success-subtle text-success", icon: CheckCircle2 },
  info: { box: "bg-accent-subtle text-accent", icon: Info },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { box, icon: Icon } = alertTones[tone];
  return (
    <div className={cx("flex items-start gap-2 rounded-md px-3 py-2.5 text-sm", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : undefined}>{children}</div>}
      </div>
    </div>
  );
}

/* ------------------------------ Field ------------------------------ */

export const inputClass =
  "w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60 disabled:cursor-not-allowed";

export const textareaClass = cx(inputClass, "h-auto py-2 leading-relaxed");

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted">{children}</p>
  );
}

/* ----------------------------- Skeleton ----------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded bg-surface-2", className)} aria-hidden />;
}

/* ----------------------------- Stepper ----------------------------- */

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number; // 0-based index of active step
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                done && "bg-accent text-white",
                active && "bg-accent-subtle text-accent ring-1 ring-accent",
                !done && !active && "bg-surface-2 text-muted"
              )}
            >
              {done ? "✓" : idx + 1}
            </span>
            <span
              className={cx(
                "text-sm",
                active ? "font-medium text-text" : done ? "text-text-2" : "text-muted"
              )}
            >
              {step}
            </span>
            {idx < steps.length - 1 && <span className="h-px w-6 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Tooltip — wraps any element (typically icon-only buttons) and shows a
 * label on hover/focus. CSS-only (group-hover + focus-within), no deps.
 * Usage: <Tooltip label="Copy"><button ... /></Tooltip>
 */
export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cx(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-text px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-none transition-opacity duration-100",
          "group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        )}
      >
        {label}
      </span>
    </span>
  );
}
