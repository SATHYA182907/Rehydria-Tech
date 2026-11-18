import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/animations/reveal";
import { RevealText } from "@/components/animations/reveal-text";
import { Container, Eyebrow, Section } from "@/components/layout/section";
import { introStatement, pillars } from "@/content/home";

/** Company introduction: a scroll-scrubbed statement and the three service pillars. */
export function IntroSection() {
  return (
    <Section aria-labelledby="intro-title">
      <Container className="flex flex-col gap-16 lg:gap-24">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-2">
            <Eyebrow>01 — Who we are</Eyebrow>
          </div>
          <h2 id="intro-title" className="sr-only">
            About Rehydria Technology
          </h2>
          <RevealText
            as="p"
            mode="scrub"
            className="text-[clamp(1.75rem,1.1rem+2.6vw,3.6rem)] leading-[1.12] font-medium tracking-[-0.035em] lg:col-span-10"
          >
            {introStatement}
          </RevealText>
        </div>

        <Reveal as="ul" className="grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <li key={pillar.title} className="bg-canvas">
              <Link
                href={pillar.href}
                className="group flex h-full flex-col gap-10 p-6 transition-colors duration-300 hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-moss md:p-8"
              >
                <div className="flex items-center justify-between font-mono text-xs text-ink-soft">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-ink-soft transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-moss"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium tracking-tight">{pillar.title}</h3>
                  <p className="leading-relaxed text-ink-soft">{pillar.body}</p>
                </div>
              </Link>
            </li>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
