import { Accent, Container, Eyebrow } from "@/components/layout/section";
import type { CourseCard } from "@/services/catalog";

function Marquee({ items, reverse = false, muted = false }: { items: string[]; reverse?: boolean; muted?: boolean }) {
  // Duplicated once so the CSS loop is seamless; the copy is hidden from assistive tech.
  return (
    <div className="marquee group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          aria-hidden={copy === 1 || undefined}
          className={`marquee-track flex shrink-0 items-center gap-4 pr-4 ${reverse ? "[animation-direction:reverse]" : ""}`}
        >
          {items.map((item) => (
            <li
              key={item}
              className={
                muted
                  ? "flex items-center gap-3 rounded-pill border border-white/15 px-5 py-2.5 text-lg whitespace-nowrap text-on-forest-soft"
                  : "flex items-center gap-3 rounded-pill bg-white/[0.06] px-5 py-2.5 text-lg whitespace-nowrap text-on-forest"
              }
            >
              <span className={muted ? "size-1.5 rounded-full border border-mint/60" : "size-1.5 rounded-full bg-mint"} />
              {item}
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/**
 * Technology showcase (dark band). Row one lists technologies taught in the published
 * programs (course tags from Firestore); row two lists roadmap topics marked as upcoming.
 */
export function TechSection({ courses, upcoming }: { courses: CourseCard[]; upcoming: readonly string[] }) {
  const taught = Array.from(new Set(courses.flatMap((c) => c.tags)));

  return (
    <section aria-labelledby="tech-title" className="relative overflow-hidden bg-forest-deep py-[clamp(96px,12vw,180px)] text-on-forest">
      {/* Oscilloscope trace */}
      <svg aria-hidden="true" viewBox="0 0 1200 200" preserveAspectRatio="none" className="absolute inset-x-0 top-1/2 h-48 w-full -translate-y-1/2 opacity-30">
        <path
          className="scope-wave"
          d="M0 100 C 50 100 50 40 100 40 S 150 160 200 160 S 250 40 300 40 S 350 160 400 160 S 450 40 500 40 S 550 160 600 160 S 650 40 700 40 S 750 160 800 160 S 850 40 900 40 S 950 160 1000 160 S 1050 40 1100 40 S 1150 100 1200 100"
          fill="none"
          stroke="var(--color-mint)"
          strokeWidth="1.5"
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 [background-image:linear-gradient(rgb(184_228_201/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(184_228_201/0.06)_1px,transparent_1px)] [background-size:64px_64px]" />

      <Container className="relative flex flex-col gap-14">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="flex flex-col gap-5 lg:col-span-7">
            <Eyebrow onDark>05 — Technology</Eyebrow>
            <h2 id="tech-title" className="text-display-md font-medium text-on-forest">
              The stack you&apos;ll <Accent className="text-mint">actually</Accent> use.
            </h2>
          </div>
          <p className="max-w-[44ch] text-lg leading-relaxed text-on-forest-soft lg:col-span-4 lg:col-start-9">
            Learn on the tools and protocols used in real products, and grow with a roadmap that keeps expanding.
          </p>
        </div>
      </Container>

      <div className="relative mt-14 flex flex-col gap-4">
        {taught.length > 0 && (
          <div>
            <p className="sr-only">Technologies taught in current programs: {taught.join(", ")}</p>
            <Marquee items={taught} />
          </div>
        )}
        <div>
          <p className="sr-only">Topics on the program roadmap: {upcoming.join(", ")}</p>
          <Marquee items={upcoming.map((t) => `${t} · soon`)} reverse muted />
        </div>
      </div>
    </section>
  );
}
