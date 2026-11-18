import { ArrowRight, MessageCircle, Quote, Star } from "lucide-react";
import Link from "next/link";
import { Magnetic } from "@/components/animations/magnetic";
import { RevealText } from "@/components/animations/reveal-text";
import { Accent, Container, Eyebrow, Section } from "@/components/layout/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { homeFaq } from "@/content/home";
import type { ReviewCard } from "@/services/catalog";

/**
 * Student testimonials: approved reviews from Firestore only. Hidden entirely when there
 * are none; testimonials are never fabricated.
 */
export function TestimonialsSection({ reviews }: { reviews: ReviewCard[] }) {
  if (reviews.length === 0) return null;
  return (
    <Section tone="canvas-2" aria-labelledby="reviews-title" className="overflow-hidden">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-5">
          <Eyebrow>Student voices</Eyebrow>
          <h2 id="reviews-title" className="max-w-[18ch] text-display-md font-medium">
            In their <Accent className="text-moss">own</Accent> words.
          </h2>
        </div>
        <ul
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
        >
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex w-[min(86vw,420px)] shrink-0 snap-start flex-col justify-between gap-8 rounded-md border border-line bg-surface p-7 shadow-card"
            >
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <Quote aria-hidden="true" className="size-7 text-mint" />
                  <span className="flex gap-0.5" aria-label={`Rated ${review.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} aria-hidden="true" className={i < review.rating ? "size-4 fill-moss text-moss" : "size-4 text-line-strong"} />
                    ))}
                  </span>
                </div>
                <blockquote className="text-lg leading-relaxed">{review.body}</blockquote>
              </div>
              <div className="flex flex-col gap-0.5 border-t border-line pt-5">
                <span className="font-medium">{review.displayName}</span>
                <span className="text-sm text-ink-soft">
                  {[review.college, review.courseTitle].filter(Boolean).join(" · ")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function FaqSection() {
  return (
    <Section aria-labelledby="faq-title">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex flex-col gap-6 lg:sticky lg:top-32">
            <Eyebrow>Questions</Eyebrow>
            <h2 id="faq-title" className="text-display-md font-medium">
              Good to <Accent className="text-moss">know</Accent>.
            </h2>
            <p className="max-w-[36ch] leading-relaxed text-ink-soft">
              Can&apos;t find what you&apos;re looking for? Browse the full FAQ or get in touch.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" size="sm">
                <Link href={routes.faq}>All FAQs</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-pill">
                <Link href={routes.contact}>
                  <MessageCircle aria-hidden="true" /> Contact us
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <Accordion type="single" collapsible className="border-t border-line lg:col-span-7 lg:col-start-6">
          {homeFaq.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Section>
  );
}

export function FinalCtaSection() {
  return (
    <section aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-canvas py-[clamp(88px,16vw,240px)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob absolute top-[10%] left-[20%] size-[50vw] max-w-[760px] rounded-full bg-mint/50 blur-[120px]" />
        <div className="aurora-blob aurora-blob--slow absolute right-[5%] bottom-0 size-[36vw] max-w-[560px] rounded-full bg-moss/20 blur-[120px]" />
        <div className="engineering-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" />
      </div>
      <Container className="flex flex-col items-center gap-10 text-center">
        <Eyebrow>Learn. Innovate. Build the Future.</Eyebrow>
        <RevealText as="h2" className="max-w-[14ch] text-display-lg font-medium">
          <span id="cta-title">
            Build the future, one <Accent className="text-moss">project</Accent> at a time.
          </span>
        </RevealText>
        <p className="max-w-[46ch] text-lg leading-relaxed text-ink-soft">
          Choose a program, start learning today and earn a certificate you can prove.
        </p>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
          <Magnetic strength={0.45} className="w-full sm:w-auto">
            <Button asChild size="lg" data-cursor="" className="w-full sm:w-auto">
              <Link href={routes.internships}>
                Explore Internships <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Magnetic>
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <Link href={routes.contact}>Talk to us</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
