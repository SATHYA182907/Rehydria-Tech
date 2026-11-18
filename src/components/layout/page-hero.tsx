import type { ReactNode } from "react";
import { RevealText } from "@/components/animations/reveal-text";
import { Container, Eyebrow } from "./section";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Optional right-hand column (desktop) for a visual or summary card. */
  aside?: ReactNode;
  children?: ReactNode;
}

/** Hero band for inner pages: editorial heading, lead and an optional aside. */
export function PageHero({ eyebrow, title, lead, aside, children }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line pt-36 pb-16 md:pt-44 md:pb-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-1/3 -right-[10%] size-[50vw] max-w-[760px] rounded-full bg-mint/35 blur-[120px]" />
        <div className="engineering-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_20%,black_10%,transparent_65%)]" />
      </div>
      <Container className="grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className={aside ? "flex flex-col gap-7 lg:col-span-7" : "flex flex-col gap-7 lg:col-span-10"}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <RevealText as="h1" immediate className="max-w-[18ch] text-display-lg font-medium">
            {title}
          </RevealText>
          {lead && <p className="max-w-[56ch] text-lg leading-relaxed text-ink-soft md:text-xl">{lead}</p>}
          {children}
        </div>
        {aside && <div className="lg:col-span-4 lg:col-start-9">{aside}</div>}
      </Container>
    </section>
  );
}
