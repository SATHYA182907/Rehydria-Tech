"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeLesson } from "@/services/student/actions";

export function CompleteLessonButton({ courseId, lessonId, completed, nextHref }: { courseId: string; lessonId: string; completed: boolean; nextHref: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (completed) {
    return (
      <span className="inline-flex h-11 items-center gap-2 rounded-pill bg-mint-soft px-5 text-[15px] font-medium text-forest">
        <CheckCircle2 aria-hidden="true" className="size-[18px]" /> Completed
      </span>
    );
  }
  return (
    <Button
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await completeLesson({ courseId, lessonId });
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success("Lesson completed", { description: "Your progress has been saved." });
          if (nextHref) router.push(nextHref);
          else router.refresh();
        })
      }
    >
      <CheckCircle2 aria-hidden="true" /> Mark as complete
    </Button>
  );
}
