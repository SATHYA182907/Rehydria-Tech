import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { Accent, Container, Section } from "@/components/layout/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { allFaqItems, faqGroups } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about Rehydria internships, enrollment, payments, learning, assessments, certificates and the Hackathon Guide.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        eyebrow="Help centre"
        title={
          <>
            Frequently asked <Accent className="text-moss">questions</Accent>.
          </>
        }
        lead="Everything about enrolling, learning, assessments and certificates."
      />
      <Section spacing="compact">
        <Container className="grid gap-12 lg:grid-cols-12">
          <nav aria-label="FAQ topics" className="lg:col-span-3">
            <ul className="flex flex-wrap gap-2 lg:sticky lg:top-32 lg:flex-col lg:gap-1">
              {faqGroups.map((g) => (
                <li key={g.id}>
                  <a href={`#${g.id}`} className="block rounded-sm px-3 py-2 text-ink-soft transition-colors hover:bg-canvas-2 hover:text-ink">
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-14 lg:col-span-8 lg:col-start-5">
            {faqGroups.map((g) => (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-32">
                <h2 id={`${g.id}-title`} className="mb-4 font-mono text-eyebrow uppercase text-moss-text">
                  {g.title}
                </h2>
                <Accordion type="multiple" className="border-t border-line">
                  {g.items.map((item, i) => (
                    <AccordionItem key={item.q} value={`${g.id}-${i}`}>
                      <AccordionTrigger>{item.q}</AccordionTrigger>
                      <AccordionContent>{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
            <div className="flex flex-col items-start gap-4 rounded-md bg-canvas-2 p-6 md:flex-row md:items-center md:justify-between">
              <p className="text-lg font-medium">Still have a question?</p>
              <Button asChild>
                <Link href={routes.contact}>Contact us</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
