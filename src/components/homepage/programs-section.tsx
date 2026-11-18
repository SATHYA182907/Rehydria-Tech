"use client";

import { ArrowUpRight, Clock, Layers, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { CourseIllustration } from "@/components/courses/course-illustration";
import { Accent, Container, Eyebrow } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { routes } from "@/config/routes";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";
import { cn } from "@/lib/utils/cn";
import type { CourseCard } from "@/services/catalog";

const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

/**
 * Internship programs. Desktop (motion allowed): the section pins and the track scrolls
 * horizontally. Everywhere else: a plain responsive grid. The layout switch happens via
 * a data attribute so server HTML is always the accessible grid.
 */
export function ProgramsSection({ courses, upcoming }: { courses: CourseCard[]; upcoming: readonly string[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track || courses.length === 0) return;
      return whenNear(section, () => {
      const mm = gsap.matchMedia();

      mm.add(`(min-width: 1024px) and (prefers-reduced-motion: no-preference)`, () => {
        track.dataset.pinned = "";
        const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);

        const tween = gsap.to(track.firstElementChild, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
            },
          },
        });

        // Illustrations drift inside their cards for parallax depth.
        gsap.utils.toArray<HTMLElement>("[data-program-art]", section).forEach((art) => {
          gsap.fromTo(
            art,
            { xPercent: 8 },
            { xPercent: -8, ease: "none", scrollTrigger: { trigger: art, containerAnimation: tween, start: "left right", end: "right left", scrub: true } },
          );
        });

        return () => {
          delete track.dataset.pinned;
        };
      });

      mm.add(MOTION_QUERIES.motion, () => {
        gsap.from(section.querySelectorAll("[data-program-card]"), {
          y: 48,
          opacity: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: section, start: "top 70%", once: true },
        });
      });
      return () => mm.revert();
      }, { margin: "100% 0px", refresh: true });
    },
    { scope: sectionRef, dependencies: [courses.length] },
  );

  return (
    <section ref={sectionRef} id="programs" aria-labelledby="programs-title" className="relative overflow-hidden bg-canvas-2">
      <Container className="flex min-h-svh flex-col justify-center gap-12 py-[clamp(96px,10vw,140px)] lg:py-20">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-5">
            <Eyebrow>02 — Internship programs</Eyebrow>
            <h2 id="programs-title" className="max-w-[16ch] text-display-md font-medium">
              Programs built around <Accent className="text-moss">real</Accent> hardware.
            </h2>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <p className="max-w-[40ch] text-lg leading-relaxed text-ink-soft lg:text-right">
              Each program moves from fundamentals to a finished project, with an assessment and a verifiable certificate at the end.
            </p>
            {courses.length > 0 && (
              <div aria-hidden="true" className="hidden h-px w-48 overflow-hidden bg-line-strong lg:block">
                <div ref={progressRef} className="h-full origin-left scale-x-0 bg-forest" />
              </div>
            )}
          </div>
        </div>

        <div ref={trackRef} className="group/track lg:data-[pinned]:-mr-10">
          <div className="grid gap-5 md:grid-cols-2 lg:group-data-[pinned]/track:flex lg:group-data-[pinned]/track:w-max lg:group-data-[pinned]/track:gap-6 lg:group-data-[pinned]/track:pr-10">
            {courses.map((course, i) => (
              <ProgramCard key={course.id} course={course} index={i} />
            ))}
            <UpcomingCard topics={upcoming} empty={courses.length === 0} />
          </div>
        </div>
      </Container>
    </section>
  );
}

function ProgramCard({ course, index }: { course: CourseCard; index: number }) {
  return (
    <Link
      href={routes.internship(course.slug)}
      data-program-card
      data-cursor="View"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-card",
        "transition-[border-color,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:border-moss/50 hover:shadow-float",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss",
        "lg:group-data-[pinned]/track:h-[min(68vh,620px)] lg:group-data-[pinned]/track:w-[min(46vw,640px)] lg:group-data-[pinned]/track:shrink-0",
      )}
    >
      <div className="engineering-grid relative flex h-56 items-center justify-center overflow-hidden border-b border-line bg-canvas lg:group-data-[pinned]/track:h-auto lg:group-data-[pinned]/track:flex-1">
        <span className="absolute top-4 left-5 font-mono text-xs text-ink-soft">{String(index + 1).padStart(2, "0")}</span>
        <span className="absolute top-4 right-5 font-mono text-xs tracking-[0.14em] text-moss">{course.code}</span>
        <div data-program-art className="w-[62%] max-w-[340px] text-forest transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
          <CourseIllustration motif={course.illustration} />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="mint">{LEVEL_LABEL[course.level]}</Badge>
          {course.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-2xl font-medium tracking-tight md:text-3xl">{course.title}</h3>
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong transition-colors duration-300 group-hover:border-forest group-hover:bg-forest group-hover:text-on-forest">
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </span>
        </div>
        <p className="line-clamp-3 max-w-[52ch] leading-relaxed text-ink-soft">{course.shortDescription}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
          <dl className="flex gap-6 font-mono text-xs text-ink-soft">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Duration</dt>
              <Clock aria-hidden="true" className="size-3.5 text-moss" />
              <dd>{course.durationLabel}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Modules</dt>
              <Layers aria-hidden="true" className="size-3.5 text-moss" />
              <dd>{course.moduleCount} modules</dd>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <dt className="sr-only">Lessons</dt>
              <PlayCircle aria-hidden="true" className="size-3.5 text-moss" />
              <dd>{course.lessonCount} lessons</dd>
            </div>
          </dl>
          <Price amountPaise={course.pricePaise} compareAtPaise={course.compareAtPricePaise} size="sm" />
        </div>
      </div>
    </Link>
  );
}

function UpcomingCard({ topics, empty }: { topics: readonly string[]; empty: boolean }) {
  return (
    <div
      data-program-card
      className={cn(
        "relative flex flex-col justify-between gap-8 overflow-hidden rounded-md bg-forest p-6 text-on-forest md:p-8",
        empty ? "md:col-span-2" : "",
        "lg:group-data-[pinned]/track:h-[min(68vh,620px)] lg:group-data-[pinned]/track:w-[min(34vw,460px)] lg:group-data-[pinned]/track:shrink-0",
      )}
    >
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2 font-mono text-eyebrow uppercase text-mint">
          <Sparkles aria-hidden="true" className="size-3.5" />
          {empty ? "Programs opening soon" : "On the roadmap"}
        </p>
        <p className="max-w-[18ch] text-3xl leading-tight font-medium tracking-tight">
          {empty ? "Our first programs are almost ready." : "More programs are on the way."}
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <li key={topic} className="rounded-pill border border-white/15 px-3 py-1 text-sm text-on-forest-soft">
            {topic}
          </li>
        ))}
      </ul>
      <Link
        href={routes.internships}
        className="inline-flex items-center gap-2 text-sm font-medium text-mint hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
      >
        Browse all programs <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}
