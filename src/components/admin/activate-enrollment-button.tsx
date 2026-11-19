"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { activateEnrollment } from "@/services/admin/actions";

export function ActivateEnrollmentButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      onClick={() => {
        if (!window.confirm("Grant course access to this student without online payment?")) return;
        start(async () => {
          const res = await activateEnrollment(id);
          if (res.ok) {
            toast.success(res.message);
            router.refresh();
          } else toast.error(res.error);
        });
      }}
    >
      Activate
    </Button>
  );
}
