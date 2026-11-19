"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setQuestionActive } from "@/services/admin/actions";

export function QuestionActiveToggle({ questionId, active }: { questionId: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={active ? "secondary" : "primary"}
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await setQuestionActive({ questionId, active: !active });
          if (res.ok) {
            toast.success(res.message);
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}
