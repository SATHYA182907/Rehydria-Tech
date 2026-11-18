import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { CountUp } from "@/components/animations/count-up";
import { cn } from "@/lib/utils/cn";

interface StatProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Percentage change vs previous period; omit to hide. */
  delta?: number;
  icon?: ReactNode;
  tone?: "light" | "forest";
  className?: string;
}

/** Big animated number with label and optional delta. Used on marketing stats and dashboards. */
export function Stat({ label, value, prefix, suffix, decimals, delta, icon, tone = "light", className }: StatProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "min-w-0 font-mono text-[11px] uppercase tracking-[0.14em]",
            tone === "forest" ? "text-on-forest-soft" : "text-ink-soft",
          )}
        >
          {label}
        </span>
        {icon && <span className={cn("shrink-0 [&_svg]:size-4", tone === "forest" ? "text-mint" : "text-moss")}>{icon}</span>}
      </div>
      <CountUp
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        className={cn("text-4xl font-medium tracking-[-0.04em] md:text-5xl", tone === "forest" ? "text-on-forest" : "text-ink")}
      />
      {delta !== undefined && (
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-xs px-1.5 py-0.5 font-mono text-xs",
            up ? "bg-mint-soft text-success" : "bg-danger-soft text-danger",
          )}
        >
          {up ? <ArrowUpRight aria-hidden="true" className="size-3.5" /> : <ArrowDownRight aria-hidden="true" className="size-3.5" />}
          {up ? "+" : ""}
          {delta.toFixed(1)}%<span className="sr-only"> compared with the previous period</span>
        </span>
      )}
    </div>
  );
}
