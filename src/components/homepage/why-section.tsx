import { BadgeCheck, CircuitBoard, Gauge, Layers, ListChecks, QrCode, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { Accent, Container, Section, SectionHeading } from "@/components/layout/section";
import { reasons } from "@/content/home";
import { cn } from "@/lib/utils/cn";

const ICONS = { Layers, CircuitBoard, Gauge, ListChecks, BadgeCheck, ShieldCheck } as const;

const SIZE: Record<(typeof reasons)[number]["size"], string> = {
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  regular: "",
};

/** Small, purely decorative visuals that give each bento tile its own identity. */
function TileVisual({ k }: { k: (typeof reasons)[number]["key"] }) {
  switch (k) {
    case "curriculum":
      return (
        <div aria-hidden="true" className="flex gap-2">
          {["01", "02", "03", "04", "05", "06"].map((n, i) => (
            <span
              key={n}
              className={cn(
                "flex h-14 flex-1 items-end rounded-xs border border-line p-2 font-mono text-[10px] text-ink-soft transition-colors duration-500",
                i < 3 && "border-moss/40 bg-mint-soft text-forest",
                "group-hover:border-moss/40",
              )}
            >
              M{n}
            </span>
          ))}
        </div>
      );
    case "practical":
      return (
        <svg aria-hidden="true" viewBox="0 0 160 200" className="mt-auto h-auto w-full max-w-[220px] text-moss" fill="none" stroke="currentColor" strokeWidth={1.4}>
          <rect x="20" y="20" width="120" height="160" rx="8" className="stroke-line-strong" />
          {Array.from({ length: 7 }, (_, row) =>
            Array.from({ length: 5 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={40 + col * 20} cy={40 + row * 20} r="2.2" className="fill-line-strong stroke-none" />
            )),
          )}
          <path d="M40 60h40v40h40" className="bento-wire" strokeWidth={2.2} strokeLinecap="round" />
          <path d="M60 140V120h40" className="bento-wire [animation-delay:0.6s]" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx="120" cy="100" r="5" className="fill-mint stroke-forest" />
        </svg>
      );
    case "pace":
      return (
        <div aria-hidden="true" className="flex flex-col gap-2">
          <div className="h-1.5 overflow-hidden rounded-pill bg-line">
            <div className="h-full w-[64%] origin-left rounded-pill bg-moss transition-transform duration-700 group-hover:scale-x-[1.3]" />
          </div>
          <p className="font-mono text-[11px] text-ink-soft">Resume · Module 04, lesson 2</p>
        </div>
      );
    case "assessment":
      return (
        <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
          {["A", "B", "C", "D"].map((o, i) => (
            <span
              key={o}
              className={cn(
                "flex h-9 items-center justify-center rounded-xs border font-mono text-xs",
                i === 2 ? "border-forest bg-forest text-mint" : "border-line text-ink-soft",
              )}
            >
              {o}
            </span>
          ))}
        </div>
      );
    case "certificate":
      return (
        <div aria-hidden="true" className="flex items-center gap-4 rounded-sm border border-line bg-canvas p-4">
          <QrCode className="size-12 shrink-0 text-forest" strokeWidth={1.2} />
          <div className="flex flex-col gap-1 font-mono text-[11px] text-ink-soft">
            <span className="text-forest">RHT-XXXX-XXXX-XXXX-XXXX</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-moss" /> Status: valid
            </span>
          </div>
        </div>
      );
    case "payments":
      return (
        <div aria-hidden="true" className="flex items-center gap-2 font-mono text-[11px] text-ink-soft">
          {["Order", "Pay", "Verify", "Access"].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className={cn("rounded-xs px-1.5 py-0.5", i === 2 ? "bg-forest text-mint" : "bg-canvas-2")}>{s}</span>
              {i < 3 && <span className="h-px w-3 bg-line-strong" />}
            </span>
          ))}
        </div>
      );
  }
}

/** "Why Rehydria": an asymmetric bento grid; each claim reflects how the platform works. */
export function WhySection() {
  return (
    <Section tone="canvas-2" aria-labelledby="why-title">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          align="split"
          eyebrow="04 — Why Rehydria"
          title={
            <span id="why-title">
              Designed for learning that <Accent className="text-moss">sticks</Accent>.
            </span>
          }
          lead="Every part of the platform, from enrollment to certification, is built to keep you focused on building skills."
        />
        <Reveal className="grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-3">
          {reasons.map((r) => {
            const Icon = ICONS[r.icon];
            return (
              <article
                key={r.key}
                className={cn(
                  "group flex flex-col gap-6 rounded-md border border-line bg-surface p-6 shadow-card transition-[border-color,transform] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-moss/40 md:p-8",
                  SIZE[r.size],
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-sm bg-mint-soft text-forest transition-transform duration-500 group-hover:rotate-[-6deg]">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium tracking-tight">{r.title}</h3>
                  <p className="max-w-[46ch] leading-relaxed text-ink-soft">{r.body}</p>
                </div>
                <div className="mt-auto">
                  <TileVisual k={r.key} />
                </div>
              </article>
            );
          })}
        </Reveal>
      </Container>
    </Section>
  );
}
