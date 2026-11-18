import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Placeholder block that matches final layout geometry while data loads. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("skeleton rounded-sm", className)} {...props} />;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "engineering-grid relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-md border border-dashed border-line-strong bg-canvas-2/50 px-6 py-14 text-center",
        "[mask-image:linear-gradient(to_bottom,black_75%,transparent)]",
        className,
      )}
    >
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-md border border-line bg-surface text-moss shadow-card [&_svg]:size-6">
          {icon}
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-lg font-medium tracking-tight">{title}</h3>
        {description && <p className="text-sm leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ProgressProps {
  /** 0–100 */
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function Progress({ value, label = "Progress", showValue = false, className }: ProgressProps) {
  const v = clamp(value);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line"
      >
        <div
          className="h-full origin-left rounded-pill bg-moss transition-transform duration-1000 ease-[var(--ease-out-expo)]"
          style={{ transform: `scaleX(${v / 100})` }}
        />
      </div>
      {showValue && <span className="w-10 text-right font-mono text-xs tabular-nums text-ink-soft">{Math.round(v)}%</span>}
    </div>
  );
}

interface ProgressRingProps extends ProgressProps {
  size?: number;
  stroke?: number;
  children?: ReactNode;
}

/** Circular progress; the stroke draws in on mount (CSS), no JS animation needed. */
export function ProgressRing({ value, label = "Progress", size = 72, stroke = 6, className, children }: ProgressRingProps) {
  const v = clamp(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-moss)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          className="ring-draw"
          style={{ ["--ring-from" as string]: c, ["--ring-to" as string]: c * (1 - v / 100), strokeDashoffset: c * (1 - v / 100) }}
        />
      </svg>
      <span className="absolute font-mono text-sm font-medium tabular-nums">{children ?? `${Math.round(v)}%`}</span>
    </div>
  );
}
