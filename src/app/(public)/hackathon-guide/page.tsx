import { BookOpenCheck, Check, Download, Lightbulb, Presentation, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/animations/reveal";
import { FaqSection } from "@/components/homepage/closing-sections";
import { GuideSection } from "@/components/homepage/guide-section";
import { PageHero } from "@/components/layout/page-hero";
import { Accent, Container, Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Price } from "@/components/ui/price";
import { routes } from "@/config/routes";
import { isPaymentsConfigured } from "@/lib/integrations";
import { getFeaturedGuide } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Hackathon Guide",
  description: "A practical guide for ideating, building and pitching at hackathons, delivered instantly to your Rehydria dashboard.",
  alternates: { canonical: "/hackathon-guide" },
};

const STEPS = [
  { icon: BookOpenCheck, title: "Buy securely", body: "Sign in and pay through Razorpay." },
  { icon: Download, title: "Download instantly", body: "The guide appears in your dashboard right after payment is verified." },
  { icon: Lightbulb, title: "Prepare with a plan", body: "Use it before and during your next hackathon." },
];

export default async function HackathonGuidePage() {
  const guide = await getFeaturedGuide();
  const payments = isPaymentsConfigured();

  return (
    <main>
      <PageHero
        eyebrow="Hackathon guidance"
        title={
          <>
            Your hackathon <Accent className="text-moss">playbook</Accent>.
          </>
        }
        lead={guide?.subtitle ?? "A practical guide for ideating, building and pitching under a deadline."}
        aside={
          guide ? (
            <div className="flex flex-col gap-5 rounded-md border border-line bg-surface p-6 shadow-card">
              <p className="text-lg font-medium">{guide.title}</p>
              <Price amountPaise={guide.pricePaise} compareAtPaise={guide.compareAtPricePaise} size="lg" />
              {payments && guide.available ? (
                <Button asChild size="lg">
                  <Link href={`/login?next=${encodeURIComponent("/dashboard/materials?buy=" + guide.id)}`}>Buy now</Link>
                </Button>
              ) : (
                <Button size="lg" disabled>
                  {guide.available ? "Purchases open soon" : "Currently unavailable"}
                </Button>
              )}
              <p className="text-[13px] text-ink-soft">Instant access in your dashboard after payment. Secure, time-limited downloads.</p>
            </div>
          ) : undefined
        }
      />

      {guide ? (
        <>
          <Section spacing="compact">
            <Container className="flex flex-col gap-12">
              <SectionHeading eyebrow="Inside the guide" title="What you'll find inside" />
              <div className="grid gap-12 lg:grid-cols-12">
                <ol className="flex flex-col divide-y divide-line border-y border-line lg:col-span-7">
                  {guide.contents.map((item, i) => (
                    <li key={item.title} className="flex gap-6 py-6">
                      <span className="font-mono text-sm text-moss-text">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-xl font-medium tracking-tight">{item.title}</h3>
                        {item.description && <p className="text-ink-soft">{item.description}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-col gap-6 lg:col-span-4 lg:col-start-9">
                  <div className="flex flex-col gap-4 rounded-md bg-canvas-2 p-6">
                    <p className="font-mono text-eyebrow uppercase text-moss-text">Why it helps</p>
                    <ul className="flex flex-col gap-3">
                      {guide.benefits.map((b) => (
                        <li key={b} className="flex gap-3">
                          <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-moss" /> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2 rounded-md border border-line p-4">
                      <Users aria-hidden="true" className="size-5 text-moss" />
                      <p className="text-sm">For individuals and teams</p>
                    </div>
                    <div className="flex flex-col gap-2 rounded-md border border-line p-4">
                      <Presentation aria-hidden="true" className="size-5 text-moss" />
                      <p className="text-sm">From idea to final pitch</p>
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </Section>
          <Section tone="canvas-2" spacing="compact">
            <Container className="flex flex-col gap-10">
              <SectionHeading eyebrow="How it works" title="Three steps to your copy" />
              <Reveal as="ol" className="grid gap-4 md:grid-cols-3">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex flex-col gap-4 rounded-md border border-line bg-surface p-6">
                    <span className="flex items-center justify-between">
                      <s.icon aria-hidden="true" className="size-6 text-moss" />
                      <span className="font-mono text-xs text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                    <h3 className="text-xl font-medium">{s.title}</h3>
                    <p className="text-ink-soft">{s.body}</p>
                  </li>
                ))}
              </Reveal>
            </Container>
          </Section>
          <GuideSection guide={guide} />
        </>
      ) : (
        <Section spacing="compact">
          <Container>
            <EmptyState
              icon={<BookOpenCheck aria-hidden="true" />}
              title="The Hackathon Guide is coming soon"
              description="We're putting the finishing touches on it. Contact us to be notified when it launches."
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href={routes.contact}>Contact us</Link>
                </Button>
              }
            />
          </Container>
        </Section>
      )}
      <FaqSection />
    </main>
  );
}
