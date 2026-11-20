import type { ReactNode } from "react";
import { Eyebrow } from "@/components/layout/section";

export function AuthHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-2.5 [@media(max-height:820px)]:mb-4 [@media(max-height:820px)]:gap-1.5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="text-[clamp(1.875rem,1.5rem+1vw,2.25rem)] leading-tight font-medium tracking-[-0.035em]">{title}</h1>
      {children && <p className="text-[15px] leading-relaxed text-ink-soft [@media(max-height:820px)]:hidden">{children}</p>}
    </div>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-sm border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
          : "rounded-sm border border-moss/25 bg-mint-soft px-4 py-3 text-sm text-forest"
      }
    >
      {children}
    </p>
  );
}
