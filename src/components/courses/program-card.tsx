import { ArrowUpRight, Clock, Layers, PlayCircle } from "lucide-react";
import Link from "next/link";
import { CourseIllustration } from "@/components/courses/course-illustration";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import type { CourseCard } from "@/services/catalog";

export const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

/**
 * Program card used on the homepage track and the /internships listing. The
 * `group-data-[pinned]/track` classes only apply inside the homepage's pinned track.
 */
export function ProgramCard({ course, index }: { course: CourseCard; index: number }) {
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
