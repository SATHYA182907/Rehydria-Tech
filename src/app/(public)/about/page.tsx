import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/animations/reveal";
import { RevealText } from "@/components/animations/reveal-text";
import { MethodologySection } from "@/components/homepage/methodology-section";
import { PageHero } from "@/components/layout/page-hero";
import { Accent, Container, Eyebrow, Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { aboutIntro, services, values } from "@/content/about";

export const metadata: Metadata = {
  title: "About",
  description: aboutIntro,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About Rehydria"
        title={
          <>
            Technology learning, <Accent className="text-moss">built</Accent> for doers.
          </>
        }
        lead={siteConfig.description}
      />

      <Section>
        <Container className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow>Who we are</Eyebrow>
          </div>
          <RevealText as="p" mode="scrub" className="text-[clamp(1.6rem,1rem+2.2vw,3rem)] leading-[1.15] font-medium tracking-[-0.03em] lg:col-span-9">
            {aboutIntro}
          </RevealText>
        </Container>
      </Section>

      <Section tone="canvas-2">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            align="split"
            eyebrow="What we do"
            title={
              <>
                Three ways we help you <Accent className="text-moss">grow</Accent>.
              </>
            }
          />
          <Reveal as="ol" className="grid gap-4 md:grid-cols-3">
            {services.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-8 rounded-md border border-line bg-surface p-7 shadow-card md:p-8">
                <span className="font-mono text-xs text-moss-text">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-3">
                  <h3 className="text-2xl font-medium tracking-tight">{s.title}</h3>
                  <p className="leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </Container>
      </Section>

      <MethodologySection />

      <Section tone="forest">
        <Container className="flex flex-col gap-14">
          <SectionHeading
            onDark
            eyebrow="What we value"
            title={
              <>
                Principles behind every <Accent className="text-mint">program</Accent>.
              </>
            }
          />
          <Reveal className="grid gap-px overflow-hidden rounded-md bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="flex flex-col gap-3 bg-forest p-7">
                <h3 className="text-xl font-medium text-on-forest">{v.title}</h3>
                <p className="leading-relaxed text-on-forest-soft">{v.body}</p>
              </div>
            ))}
          </Reveal>
        </Container>
      </Section>

      <Section spacing="compact">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <h2 className="max-w-[16ch] text-display-md font-medium">
            Ready to <Accent className="text-moss">start</Accent> building?
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={routes.internships}>
                Explore Internships <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={routes.contact}>Contact us</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </main>
  );
}
