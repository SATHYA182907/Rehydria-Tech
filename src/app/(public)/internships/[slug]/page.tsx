import { Award, BookOpen, CheckCircle2, Clock, FileText, Layers, ListChecks, PenTool, PlayCircle, Signal } from "lucide-react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/feedback";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseIllustration } from "@/components/courses/course-illustration";
import { LEVEL_LABEL } from "@/components/courses/program-card";
import { FaqSection } from "@/components/homepage/closing-sections";
import { Container, Eyebrow, Section } from "@/components/layout/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { Price } from "@/components/ui/price";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getCourseBySlug, getPublishedCourses } from "@/services/catalog";

/** Placeholder used only when no course is published yet (Cache Components needs ≥ 1 param). */
const PLACEHOLDER = "__none__";

export async function generateStaticParams() {
  const courses = await getPublishedCourses();
  return courses.length ? courses.map((c) => ({ slug: c.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/internships/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = slug === PLACEHOLDER ? null : await getCourseBySlug(slug);
  if (!course) return { title: "Program not found" };
  return {
    title: course.seoTitle ?? `${course.title} Internship`,
    description: course.seoDescription ?? course.shortDescription,
    alternates: { canonical: routes.internship(course.slug) },
    openGraph: { title: course.title, description: course.shortDescription },
  };
}

const LESSON_ICON = { video: PlayCircle, reading: FileText, assignment: PenTool, resource: BookOpen } as const;

async function CourseContent({ params }: { params: PageProps<"/internships/[slug]">["params"] }) {
  const { slug } = await params;
  const course = slug === PLACEHOLDER ? null : await getCourseBySlug(slug);
  if (!course) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription,
    provider: { "@type": "Organization", name: siteConfig.legalName, sameAs: siteConfig.url },
    ...(course.pricePaise > 0 ? { offers: { "@type": "Offer", category: "Paid", price: (course.pricePaise / 100).toFixed(2), priceCurrency: "INR" } } : {}),
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: course.durationLabel },
  };

  const facts = [
    { icon: Clock, label: "Duration", value: course.durationLabel },
    { icon: Layers, label: "Modules", value: String(course.moduleCount) },
    { icon: PlayCircle, label: "Lessons", value: String(course.lessonCount) },
    { icon: Signal, label: "Level", value: LEVEL_LABEL[course.level] },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="relative isolate overflow-hidden border-b border-line pt-36 pb-16 md:pt-44">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-1/3 -right-[10%] size-[50vw] max-w-[760px] rounded-full bg-mint/35 blur-[120px]" />
          <div className="engineering-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_20%,black_10%,transparent_65%)]" />
        </div>
        <Container className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <nav aria-label="Breadcrumb" className="font-mono text-xs text-ink-soft">
              <Link href={routes.internships} className="hover:text-ink">Internships</Link> <span aria-hidden="true">/</span> {course.code}
            </nav>
            <div className="flex flex-wrap gap-2">
              <Badge variant="mint">{LEVEL_LABEL[course.level]}</Badge>
              {course.tags.map((t) => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
            <h1 className="max-w-[16ch] text-display-lg font-medium">{course.title}</h1>
            <p className="max-w-[56ch] text-lg leading-relaxed text-ink-soft md:text-xl">{course.shortDescription}</p>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-1 border-l border-line-strong pl-4">
                  <dt className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                    <Icon aria-hidden="true" className="size-3.5 text-moss" />
                    {label}
                  </dt>
                  <dd className="text-lg font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="engineering-grid flex items-center justify-center rounded-md border border-line bg-canvas p-10 text-forest">
              <CourseIllustration motif={course.illustration} className="max-w-[320px]" />
            </div>
          </div>
        </Container>
      </section>

      <Section spacing="compact">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-16 lg:col-span-7">
            {course.description && (
              <section aria-labelledby="overview-title" className="flex flex-col gap-5">
                <h2 id="overview-title" className="text-3xl font-medium tracking-tight">Overview</h2>
                <Markdown source={course.description} className="text-lg" />
              </section>
            )}

            {course.objectives.length > 0 && (
              <section aria-labelledby="objectives-title" className="flex flex-col gap-5">
                <h2 id="objectives-title" className="text-3xl font-medium tracking-tight">What you&apos;ll learn</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.objectives.map((o) => (
                    <li key={o} className="flex gap-3 rounded-sm border border-line bg-surface p-4">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-moss" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="curriculum-title" className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <h2 id="curriculum-title" className="text-3xl font-medium tracking-tight">Curriculum</h2>
                <p className="font-mono text-xs text-ink-soft">
                  {course.moduleCount} levels · {course.lessonCount} lessons
                </p>
              </div>
              {course.curriculum.length > 0 ? (
                <Accordion type="multiple" defaultValue={[course.curriculum[0]!.id]} className="border-t border-line">
                  {course.curriculum.map((mod) => (
                    <AccordionItem key={mod.id} value={mod.id}>
                      <AccordionTrigger className="text-lg md:text-xl">
                        <span className="flex flex-col gap-1">
                          <span>{mod.title}</span>
                          {mod.summary && <span className="text-sm font-normal text-ink-soft">{mod.summary}</span>}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {mod.topics.length > 0 && (
                          <ol className="mb-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                            {mod.topics.map((topic, t) => (
                              <li key={topic} className="flex items-start gap-2.5 text-[15px]">
                                <span className="mt-0.5 font-mono text-xs text-moss-text tabular-nums">{String(t + 1).padStart(2, "0")}</span>
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                        <ul className="flex flex-col divide-y divide-line rounded-sm border border-line bg-surface">
                          {mod.lessons.map((lesson) => {
                            const Icon = LESSON_ICON[lesson.type as keyof typeof LESSON_ICON] ?? PlayCircle;
                            return (
                              <li key={lesson.id} className="flex items-center gap-3 px-4 py-3 text-ink">
                                <Icon aria-hidden="true" className="size-4 shrink-0 text-moss" />
                                <span className="flex-1">{lesson.title}</span>
                                {lesson.isPreview && <Badge variant="mint">Preview</Badge>}
                                {lesson.durationMinutes ? <span className="font-mono text-xs text-ink-soft">{lesson.durationMinutes} min</span> : null}
                              </li>
                            );
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-ink-soft">The detailed curriculum will be published soon.</p>
              )}
            </section>

            <section aria-labelledby="outcome-title" className="grid gap-4 sm:grid-cols-2">
              <h2 id="outcome-title" className="sr-only">Assessment and certificate</h2>
              <div className="flex flex-col gap-3 rounded-md bg-canvas-2 p-6">
                <ListChecks aria-hidden="true" className="size-6 text-moss" />
                <h3 className="text-xl font-medium">Online assessment</h3>
                <p className="text-ink-soft">A timed multiple-choice assessment unlocks when you complete the course, graded automatically on our servers.</p>
              </div>
              {course.certificateEnabled && (
                <div className="flex flex-col gap-3 rounded-md bg-forest p-6 text-on-forest">
                  <Award aria-hidden="true" className="size-6 text-mint" />
                  <h3 className="text-xl font-medium">Verifiable certificate</h3>
                  <p className="text-on-forest-soft">Pass to receive a certificate with a unique ID and QR code that anyone can verify online.</p>
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="flex flex-col gap-6 rounded-md border border-line bg-surface p-6 shadow-card lg:sticky lg:top-28 md:p-8">
              <Eyebrow>{course.code}</Eyebrow>
              <Price amountPaise={course.pricePaise} compareAtPaise={course.compareAtPricePaise} size="lg" />
              {course.enrollmentOpen ? (
                <Button asChild size="lg" className="w-full">
                  <Link href={routes.enroll(course.slug)}>Enroll now</Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  Enrollment opens soon
                </Button>
              )}
              {course.prerequisites.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-line pt-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">Before you start</p>
                  <ul className="flex flex-col gap-2 text-sm">
                    {course.prerequisites.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-moss" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="flex flex-col gap-2 border-t border-line pt-5 text-sm text-ink-soft">
                {course.highlights.map((h) => (
                  <li key={h.label} className="flex items-center gap-2">
                    <CheckCircle2 aria-hidden="true" className="size-4 text-moss" /> {h.label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </Container>
      </Section>

      <FaqSection />

      {/* Phones: the price card sits far down the page, so keep the main action in reach. */}
      <div aria-hidden="true" className="h-20 lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-canvas/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm text-ink-soft">{course.title}</span>
          <Price amountPaise={course.pricePaise} compareAtPaise={course.compareAtPricePaise} size="sm" />
        </div>
        {course.enrollmentOpen ? (
          <Button asChild className="shrink-0">
            <Link href={routes.enroll(course.slug)}>Enroll now</Link>
          </Button>
        ) : (
          <Button className="shrink-0" disabled>
            Opens soon
          </Button>
        )}
      </div>
    </main>
  );
}

/**
 * Params are awaited inside <Suspense> so pages for slugs published after the build render on
 * demand (and are then cached), while build-time slugs stay fully prerendered.
 */
export default function CoursePage({ params }: PageProps<"/internships/[slug]">) {
  return (
    <Suspense fallback={<main className="pt-40 pb-24"><div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-10"><Skeleton className="h-96 w-full" /></div></main>}>
      <CourseContent params={params} />
    </Suspense>
  );
}
