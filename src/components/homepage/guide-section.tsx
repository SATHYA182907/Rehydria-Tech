import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Magnetic } from "@/components/animations/magnetic";
import { MaskReveal } from "@/components/animations/mask-reveal";
import { Accent, Container, Eyebrow, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { routes } from "@/config/routes";
import type { GuideCard } from "@/services/catalog";

/** Typographic cover used until an admin uploads a real cover image. */
function GuideCover({ guide }: { guide: GuideCard }) {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-forest p-8 text-on-forest">
      <div aria-hidden="true" className="absolute inset-0 [background-image:radial-gradient(rgb(184_228_201/0.14)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div aria-hidden="true" className="absolute top-0 left-0 h-full w-3 bg-gradient-to-r from-black/30 to-transparent" />
      <p className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-mint">Rehydria · Guide</p>
      <div className="relative flex flex-col gap-3">
        <p className="text-4xl leading-[0.95] font-medium tracking-[-0.04em]">{guide.title}</p>
        <p className="max-w-[24ch] text-sm text-on-forest-soft">{guide.subtitle}</p>
      </div>
      <div aria-hidden="true" className="relative flex items-center justify-between font-mono text-[10px] text-on-forest-soft">
        <span>IDEATE · BUILD · PITCH</span>
        <span className="size-6 rounded-full border border-mint/50" />
      </div>
    </div>
  );
}

/** Hackathon Guide promotion. Hidden when no guide is published. */
export function GuideSection({ guide }: { guide: GuideCard | null }) {
  if (!guide) return null;

  return (
    <Section aria-labelledby="guide-title" className="overflow-hidden">
      <Container className="grid items-center gap-14 lg:grid-cols-12">
        <div className="relative mx-auto w-full max-w-[420px] lg:col-span-5 lg:max-w-none">
          <div aria-hidden="true" className="absolute -inset-10 -z-10 rounded-full bg-mint/40 blur-[90px]" />
          <div className="[perspective:1400px]">
            <div className="guide-book relative aspect-[3/4] rounded-r-md shadow-float [transform:rotateY(-18deg)_rotateX(4deg)] [transform-style:preserve-3d]">
              <MaskReveal className="h-full rounded-r-md">
                {guide.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded cover, dimensions vary
                  <img src={guide.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <GuideCover guide={guide} />
                )}
              </MaskReveal>
              <div aria-hidden="true" className="absolute top-1 right-[-10px] bottom-1 w-[10px] rounded-r-sm bg-[repeating-linear-gradient(to_bottom,#fff_0,#fff_2px,#e9ece8_2px,#e9ece8_3px)] [transform:rotateY(90deg)] [transform-origin:left]" />
            </div>
          </div>
          <div className="absolute -right-2 bottom-10 rounded-pill border border-white/70 bg-canvas/80 px-4 py-2 shadow-card backdrop-blur-md md:-right-6">
            <Price amountPaise={guide.pricePaise} compareAtPaise={guide.compareAtPricePaise} size="sm" />
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-6 lg:col-start-7">
          <Eyebrow>06 — Hackathon guidance</Eyebrow>
          <h2 id="guide-title" className="text-display-md font-medium">
            Walk into your next hackathon <Accent className="text-moss">ready</Accent>.
          </h2>
          <p className="max-w-[52ch] text-lg leading-relaxed text-ink-soft">{guide.subtitle}</p>
          {guide.contents.length > 0 && (
            <ol className="flex flex-col divide-y divide-line border-y border-line">
              {guide.contents.slice(0, 4).map((item, i) => (
                <li key={item.title} className="flex items-baseline gap-5 py-4">
                  <span className="font-mono text-xs text-moss">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-lg font-medium tracking-tight">{item.title}</span>
                </li>
              ))}
            </ol>
          )}
          <ul className="flex flex-col gap-2 text-ink-soft">
            {["Instant access in your dashboard after payment", "Downloads through secure, time-limited links"].map((line) => (
              <li key={line} className="flex items-center gap-2.5">
                <Check aria-hidden="true" className="size-4 text-moss" />
                {line}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-5">
            <Magnetic>
              <Button asChild size="lg">
                <Link href={routes.hackathonGuide}>
                  Get the guide <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </Magnetic>
            <Price amountPaise={guide.pricePaise} compareAtPaise={guide.compareAtPricePaise} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
