import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** 12-column page frame: max 1440px, fluid gutters (16px on phones). */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-10", className)} {...props} />;
}

const TONES = {
  canvas: "bg-canvas text-ink",
  "canvas-2": "bg-canvas-2 text-ink",
  forest: "bg-forest text-on-forest",
  "forest-deep": "bg-forest-deep text-on-forest",
} as const;

interface SectionProps extends ComponentProps<"section"> {
  tone?: keyof typeof TONES;
  /** Vertical rhythm. `default` uses the editorial clamp(96px, 12vw, 200px). */
  spacing?: "default" | "compact" | "none";
}

export function Section({ tone = "canvas", spacing = "default", className, ...props }: SectionProps) {
  return (
    <section
      data-tone={tone}
      className={cn(
        "relative",
        TONES[tone],
        spacing === "default" && "py-[clamp(72px,12vw,200px)]",
        spacing === "compact" && "py-[clamp(56px,8vw,120px)]",
        className,
      )}
      {...props}
    />
  );
}

interface SectionHeadingProps {
  /** Mono index label, e.g. "02 — Programs". Rendered as [ 02 — PROGRAMS ]. */
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  /** `split`: heading on the left columns, lead on the right (asymmetric editorial layout). */
  align?: "start" | "split" | "center";
  as?: "h1" | "h2" | "h3";
  size?: "lg" | "md";
  onDark?: boolean;
  className?: string;
}

/**
 * Section heading. Wrap one or two words of the title in <Accent> for the serif italic accent.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "start",
  as: Tag = "h2",
  size = "md",
  onDark = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        align === "split" && "lg:grid-cols-12 lg:items-end lg:gap-10",
        align === "center" && "mx-auto max-w-4xl justify-items-center text-center",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-5", align === "split" && "lg:col-span-7")}>
        {eyebrow && <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>}
        <Tag
          className={cn(
            "font-medium",
            size === "lg" ? "text-display-lg" : "text-display-md",
            onDark ? "text-on-forest" : "text-ink",
          )}
        >
          {title}
        </Tag>
      </div>
      {lead && (
        <p
          className={cn(
            "max-w-[52ch] text-lg leading-relaxed md:text-xl",
            onDark ? "text-on-forest-soft" : "text-ink-soft",
            align === "split" && "lg:col-span-4 lg:col-start-9",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

export function Eyebrow({ children, onDark = false, className }: { children: ReactNode; onDark?: boolean; className?: string }) {
  return (
    <p className={cn("font-mono text-eyebrow uppercase", onDark ? "text-mint" : "text-moss-text", className)}>
      <span aria-hidden="true">[ </span>
      {children}
      <span aria-hidden="true"> ]</span>
    </p>
  );
}

/** Serif italic accent for one or two words inside a display heading. */
export function Accent({ children, className }: { children: ReactNode; className?: string }) {
  return <em className={cn("font-serif font-normal tracking-[-0.01em] italic", className)}>{children}</em>;
}
