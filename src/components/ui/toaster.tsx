"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Toaster as Sonner } from "sonner";

/** Global toast outlet (mounted once in the root layout). Use `toast()` from "sonner". */
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      gap={10}
      offset={20}
      icons={{
        success: <CircleCheck className="size-[18px] text-moss" />,
        error: <CircleAlert className="size-[18px] text-danger" />,
        warning: <TriangleAlert className="size-[18px] text-warning" />,
        info: <Info className="size-[18px] text-info" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[min(360px,calc(100vw-2rem))] items-start gap-3 rounded-sm border border-line bg-surface p-4 font-sans shadow-float",
          title: "text-[15px] font-medium text-ink",
          description: "mt-0.5 text-sm text-ink-soft",
          actionButton: "ml-auto rounded-pill bg-forest px-3 py-1 text-xs font-medium text-on-forest",
          cancelButton: "ml-auto rounded-pill bg-canvas-2 px-3 py-1 text-xs font-medium text-ink",
          icon: "mt-0.5",
        },
      }}
    />
  );
}
