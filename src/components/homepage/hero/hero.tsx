"use client";

import { ArrowDown, ArrowRight, BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Magnetic } from "@/components/animations/magnetic";
import { Accent, Container } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { gsap, MOTION_QUERIES, SplitText, useGSAP } from "@/lib/gsap";
import { consumeEntrance, useIntroDone } from "../intro-store";
import { HeroShowcase, type ShowcaseProgram } from "./hero-showcase";

/**
 * Homepage hero. Copy comes from siteConfig. The entrance timeline waits for the preloader
 * (useIntroDone); scroll then drifts the visual and headline apart for depth.
 * Phones get the copy first (headline = LCP) and a static, lightweight showcase below it.
 */
export function Hero({ program }: { program: ShowcaseProgram | null }) {
  const rootRef = useRef<HTMLElement>(null);
  const introDone = useIntroDone();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !introDone) return;
      const reveal = root.querySelectorAll<HTMLElement>(".intro-reveal");
      // The choreographed entrance runs once, straight after the preloader. Otherwise the
      // hero must be visible immediately (repeat visits, client navigation): set inline
      // visibility so no stylesheet rule can keep it hidden.
      const playEntrance = consumeEntrance();
      if (!playEntrance) gsap.set(reveal, { autoAlpha: 1 });
      const mm = gsap.matchMedia();

      // Choreographed entrance on capable desktops only. Phones and tablets render the hero
      // immediately so the headline is the Largest Contentful Paint (see globals.css).
      mm.add(MOTION_QUERIES.desktopPointer, () => {
        const headline = root.querySelector<HTMLElement>("[data-hero-headline]");
        const split =
          playEntrance && headline
            ? SplitText.create(headline, { type: "lines", mask: "lines", linesClass: "reveal-line", aria: "none" })
            : null;

        gsap.set(reveal, { autoAlpha: 1 });
        // Built only when it will play: `from()` tweens apply their start state immediately.
        if (playEntrance) {
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          if (split) tl.from(split.lines, { yPercent: 115, duration: 1.3, stagger: 0.1 }, 0);
          tl.from("[data-hero-accent]", { opacity: 0, skewX: -14, x: -24, duration: 1.4 }, 0.35)
            .from("[data-hero-fade]", { opacity: 0, y: 24, duration: 1, stagger: 0.08 }, 0.45)
            .from("[data-hero-visual]", { opacity: 0, scale: 0.9, rotate: -4, y: 40, duration: 1.8 }, 0.1)
            .from("[data-depth]", { opacity: 0, y: 40, scale: 0.94, duration: 1.4, stagger: 0.12 }, 0.35)
            .from("[data-hero-rule]", { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "expo.inOut" }, 0.3);
        }

        // Scroll-away depth: the visual drifts up faster than the copy.
        gsap.to("[data-hero-visual]", {
          yPercent: -18,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to("[data-hero-copy]", {
          yPercent: -8,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { trigger: root, start: "center top", end: "bottom top", scrub: true },
        });
        return () => split?.revert();
      });

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [introDone] },
  );

  return (
    <section ref={rootRef} aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Aurora + engineering grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob absolute -top-[10%] -right-[25%] size-[90vw] max-w-[900px] rounded-full bg-mint/45 blur-[70px] lg:-top-[20%] lg:-right-[10%] lg:size-[60vw] lg:blur-[110px]" />
        <div className="aurora-blob aurora-blob--slow absolute top-[35%] -left-[15%] hidden size-[45vw] max-w-[700px] rounded-full bg-moss/15 blur-[120px] lg:block" />
        <div className="engineering-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_60%_40%,black_20%,transparent_70%)]" />
      </div>

      <Container className="grid grid-cols-1 gap-12 pt-28 pb-16 sm:pt-32 lg:min-h-svh lg:grid-cols-12 lg:content-center lg:gap-0 lg:pb-14">
        <div
          data-hero-visual
          className="intro-reveal relative order-last w-full max-w-[520px] justify-self-center lg:order-none lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:max-w-[600px] lg:self-center lg:justify-self-end"
        >
          <HeroShowcase program={program} />
        </div>

        <div data-hero-copy className="relative z-10 flex flex-col gap-6 sm:gap-7 lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:self-center">
          <p data-hero-fade className="intro-reveal font-mono text-eyebrow uppercase text-moss-text">
            <span aria-hidden="true">[ </span>
            Technical internships · Hackathon guidance
            <span aria-hidden="true"> ]</span>
          </p>
          <h1
            id="hero-title"
            className="intro-reveal text-[clamp(3rem,1rem+6.4vw,7.5rem)] leading-[0.95] font-medium tracking-[-0.045em] text-ink"
          >
            <span data-hero-headline className="block">
              Where Technology{" "}
              <Accent className="text-moss">
                <span data-hero-accent className="inline-block pr-[0.08em]">Meets</span>
              </Accent>{" "}
              Innovation.
            </span>
          </h1>
          <div data-hero-rule aria-hidden="true" className="intro-reveal h-px w-full max-w-xl bg-line-strong" />
          <p data-hero-fade className="intro-reveal max-w-[48ch] text-base leading-relaxed text-ink-soft sm:text-lg">
            Explore industry-oriented internships, develop practical technical skills and transform your ideas into
            real-world innovations with {siteConfig.name}.
          </p>
          <div data-hero-fade className="intro-reveal flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Magnetic className="w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={routes.internships}>
                  Explore Internships
                  <ArrowRight aria-hidden="true" className="transition-transform duration-300 group-hover/button:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href={routes.hackathonGuide}>
                <BookOpenCheck aria-hidden="true" />
                Explore Hackathon Guide
              </Link>
            </Button>
          </div>
        </div>

        <div
          data-hero-fade
          aria-hidden="true"
          className="intro-reveal absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft xl:flex"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-line-strong">
            <ArrowDown className="size-3.5 animate-bounce" />
          </span>
          Scroll
        </div>
      </Container>
    </section>
  );
}
