import { BookOpen, GraduationCap, Layers, PlayCircle, Users } from "lucide-react";
import { Container } from "@/components/layout/section";
import { Stat } from "@/components/ui/stat";
import type { CourseCard, PlatformStats } from "@/services/catalog";

interface StatsSectionProps {
  courses: CourseCard[];
  stats: PlatformStats | null;
}

/**
 * "By the numbers" band. Every figure is computed from live data: published programs,
 * their modules and lessons, plus real platform counters (settings/stats) once they are
 * non-zero. Nothing is hardcoded; the band hides itself when there is no data.
 */
export function StatsSection({ courses, stats }: StatsSectionProps) {
  const items: { label: string; value: number; icon: React.ReactNode }[] = [];
  if (courses.length > 0) {
    items.push({ label: "Programs live", value: courses.length, icon: <BookOpen aria-hidden="true" /> });
    items.push({ label: "Learning modules", value: courses.reduce((n, c) => n + c.moduleCount, 0), icon: <Layers aria-hidden="true" /> });
    items.push({ label: "Lessons", value: courses.reduce((n, c) => n + c.lessonCount, 0), icon: <PlayCircle aria-hidden="true" /> });
  }
  if (stats && stats.students > 0) items.push({ label: "Students", value: stats.students, icon: <Users aria-hidden="true" /> });
  if (stats && stats.certificatesIssued > 0) {
    items.push({ label: "Certificates issued", value: stats.certificatesIssued, icon: <GraduationCap aria-hidden="true" /> });
  }
  if (items.length === 0) return null;

  return (
    <section aria-label="Rehydria by the numbers" className="bg-canvas pb-[clamp(64px,8vw,120px)]">
      <Container>
        <div className="relative overflow-hidden rounded-md bg-forest px-6 py-12 text-on-forest md:px-12 md:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 [background-image:radial-gradient(rgb(184_228_201/0.1)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_right,transparent,black_40%)]"
          />
          <div className="relative flex flex-col gap-10">
            <p className="font-mono text-eyebrow uppercase text-mint">[ By the numbers · live from our catalog ]</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:flex lg:justify-between">
              {items.map((item) => (
                <Stat key={item.label} tone="forest" label={item.label} value={item.value} icon={item.icon} className="min-w-0 lg:min-w-[10rem]" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
