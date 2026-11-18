import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Default brand mark: a node-and-trace glyph (circuit motif) plus the wordmark.
 * When an administrator uploads an official logo (settings/company.logoPath), pass its
 * URL via `logoUrl` and it replaces the mark.
 */
export function LogoMark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)} fill="none">
      <rect width="32" height="32" rx="8" className={onDark ? "fill-mint" : "fill-forest"} />
      <g
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={onDark ? "stroke-forest-deep" : "stroke-mint"}
      >
        <path data-trace d="M11 24V8h6.5a4.5 4.5 0 0 1 0 9H11" />
        <path data-trace d="M16.5 17 21 24" />
      </g>
      <circle cx="21" cy="24" r="1.9" className={onDark ? "fill-forest-deep" : "fill-mint"} />
      <circle cx="11" cy="8" r="1.9" className={onDark ? "fill-forest-deep" : "fill-mint"} />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  onDark?: boolean;
  logoUrl?: string | null;
  href?: string;
}

export function Logo({ className, onDark = false, logoUrl, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded SVG/PNG of unknown dimensions
        <img src={logoUrl} alt="" className="h-8 w-auto" />
      ) : (
        <LogoMark onDark={onDark} className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-[-8deg]" />
      )}
      <span className={cn("flex flex-col leading-none", onDark ? "text-on-forest" : "text-ink")}>
        <span className="text-[17px] font-semibold tracking-[-0.03em]">Rehydria</span>{" "}
        <span className={cn("mt-1 font-mono text-[9px] uppercase tracking-[0.2em]", onDark ? "text-on-forest-soft" : "text-ink-soft")}>
          Technology
        </span>
        <span className="sr-only">, home</span>
      </span>
    </Link>
  );
}
