import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { CourseIllustration } from "@/components/courses/course-illustration";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/feedback";
import type { StudentEnrollment } from "@/services/student";

export function CourseTile({ e }: { e: StudentEnrollment }) {
  return (
    <Link
      href={`/dashboard/courses/${e.courseId}`}
      className="group flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-card transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-moss/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
    >
      <div className="engineering-grid flex h-36 items-center justify-center border-b border-line bg-canvas text-forest">
        <CourseIllustration motif={e.illustration} className="w-40" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-ink-soft">{e.code}</span>
          {e.status === "completed" ? (
            <Badge variant="success">
              <CheckCircle2 aria-hidden="true" /> Completed
            </Badge>
          ) : (
            <Badge variant="mint">In progress</Badge>
          )}
        </div>
        <h3 className="text-lg font-medium tracking-tight">{e.title}</h3>
        <div className="mt-auto flex flex-col gap-2">
          <Progress value={e.progress.percent} showValue label={`${e.title} progress`} />
          <p className="flex items-center justify-between text-sm text-ink-soft">
            {e.progress.completedLessons} of {e.progress.requiredLessons} lessons
            <span className="flex items-center gap-1 font-medium text-moss-text">
              {e.progress.percent > 0 ? "Resume" : "Start"} <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
