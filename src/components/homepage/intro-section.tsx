import { RevealText } from "@/components/animations/reveal-text";
import { WordTicker } from "@/components/animations/word-ticker";
import { Accent, Container, Eyebrow, Section } from "@/components/layout/section";
import { introStatement, introTickerWords } from "@/content/home";
import { StackedPillars } from "./stacked-pillars";

/**
 * "Who we are": a compact editorial header with a kinetic word ticker, followed by the
 * three services as scroll-stacking cards.
 */
export function IntroSection() {
  return (
    <Section aria-labelledby="intro-title">
      <Container className="flex flex-col gap-12 md:gap-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="flex flex-col gap-5 lg:col-span-7">
            <Eyebrow>01 — Who we are</Eyebrow>
            <RevealText as="h2" id="intro-title" className="max-w-[16ch] text-display-md font-medium">
              We turn curiosity into <Accent className="text-moss">capability</Accent>.
            </RevealText>
          </div>
          <div className="flex flex-col gap-5 lg:col-span-5">
            <p className="flex items-baseline gap-3 font-mono text-sm uppercase tracking-[0.14em] text-ink-soft">
              <span aria-hidden="true" className="h-px w-8 translate-y-[-0.3em] bg-moss" />
              <span className="sr-only">Our focus: </span>
              <WordTicker words={introTickerWords} className="font-sans text-2xl font-medium tracking-[-0.02em] text-moss-text normal-case sm:text-3xl" />
            </p>
            <p className="max-w-[52ch] text-base leading-relaxed text-ink-soft md:text-lg">{introStatement}</p>
          </div>
        </div>
        <StackedPillars />
      </Container>
    </Section>
  );
}
