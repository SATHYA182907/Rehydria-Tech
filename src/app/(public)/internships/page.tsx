import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { Reveal } from "@/components/animations/reveal";
import { ProgramCard } from "@/components/courses/program-card";
import { FaqSection } from "@/components/homepage/closing-sections";
import { PageHero } from "@/components/layout/page-hero";
import { Accent, Container, Section } from "@/components/layout/section";
import { EmptyState } from "@/components/ui/feedback";
import { roadmapTopics } from "@/content/home";
import { getPublishedCourses } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Internship programs",
  description: "Industry-oriented technical internships with hands-on modules, an online assessment and a verifiable certificate.",
  alternates: { canonical: "/internships" },
};

export default async function InternshipsPage() {
  const courses = await getPublishedCourses();
  return (
    <main>
      <PageHero
        eyebrow="Internship programs"
        title={
          <>
            Learn by <Accent className="text-moss">building</Accent> real systems.
          </>
        }
        lead="Every program moves from fundamentals to a finished project, then ends with an online assessment and a certificate anyone can verify."
      />
      <Section spacing="compact">
        <Container className="flex flex-col gap-10">
          {courses.length > 0 ? (
            <Reveal className="grid gap-5 md:grid-cols-2">
              {courses.map((course, i) => (
                <ProgramCard key={course.id} course={course} index={i} />
              ))}
            </Reveal>
          ) : (
            <EmptyState
              icon={<Sparkles aria-hidden="true" />}
              title="Programs are opening soon"
              description="Our first internship programs are being prepared. Check back shortly or contact us to be notified."
            />
          )}
          <div className="flex flex-col gap-4 rounded-md border border-line bg-canvas-2 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-eyebrow uppercase text-moss-text">On the roadmap</p>
              <p className="text-lg font-medium">More programs are on the way.</p>
            </div>
            <ul className="flex flex-wrap gap-2 md:max-w-[60%] md:justify-end">
              {roadmapTopics.map((t) => (
                <li key={t} className="rounded-pill border border-line-strong bg-surface px-3 py-1 text-sm text-ink-soft">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
      <FaqSection />
    </main>
  );
}
