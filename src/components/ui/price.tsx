import { formatPaise } from "@/shared/money";
import { cn } from "@/lib/utils/cn";

interface PriceProps {
  /** Integer paise. */
  amountPaise: number;
  compareAtPaise?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "text-lg", md: "text-2xl", lg: "text-4xl md:text-5xl" } as const;

/** Displays an INR price from paise, with an optional struck-through compare-at price. */
export function Price({ amountPaise, compareAtPaise, className, size = "md" }: PriceProps) {
  // 0 means the fee has not been set yet (never show "₹0" for a paid program).
  if (amountPaise === 0) {
    return <span className={cn("font-medium tracking-tight text-ink", size === "lg" ? "text-xl md:text-2xl" : "text-base", className)}>Fee to be announced</span>;
  }
  const showCompare = typeof compareAtPaise === "number" && compareAtPaise > amountPaise;
  return (
    <span className={cn("inline-flex items-baseline gap-2.5", className)}>
      <span className={cn("font-medium tracking-[-0.03em] text-ink", SIZES[size])}>{formatPaise(amountPaise)}</span>
      {showCompare && (
        <s className="text-sm text-ink-soft">
          <span className="sr-only">Original price </span>
          {formatPaise(compareAtPaise)}
        </s>
      )}
    </span>
  );
}
