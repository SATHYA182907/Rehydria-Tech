"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState, type ComponentProps } from "react";
import { useLenisLock } from "@/components/animations/smooth-scroll-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Dialog root that also pauses Lenis smooth scrolling while open. Works controlled
 * (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`).
 */
export function Dialog({ open, defaultOpen, onOpenChange, ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isOpen = open ?? internalOpen;
  useLenisLock(isOpen);
  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(next) => {
        setInternalOpen(next);
        onOpenChange?.(next);
      }}
      {...props}
    />
  );
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Overlay({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Overlay
      className={cn("anim-fade fixed inset-0 z-50 bg-forest-deep/30 backdrop-blur-[3px]", className)}
    />
  );
}

function CloseButton() {
  return (
    <DialogPrimitive.Close
      className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-moss"
      aria-label="Close"
    >
      <X aria-hidden="true" className="size-[18px]" />
    </DialogPrimitive.Close>
  );
}

interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  hideClose?: boolean;
}

export function DialogContent({ className, children, hideClose, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        data-lenis-prevent
        className={cn(
          "anim-pop fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "overflow-y-auto rounded-md border border-line bg-surface p-6 shadow-float sm:p-8",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && <CloseButton />}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

const SHEET_SIDES = {
  right: "anim-sheet-right inset-y-0 right-0 h-dvh w-full max-w-md border-l",
  left: "anim-sheet-left inset-y-0 left-0 h-dvh w-full max-w-md border-r",
  bottom: "anim-sheet-bottom inset-x-0 bottom-0 max-h-[90dvh] rounded-t-md border-t",
  full: "anim-fade inset-0 h-dvh w-full",
} as const;

interface SheetContentProps extends DialogContentProps {
  side?: keyof typeof SHEET_SIDES;
}

/** Edge-anchored panel built on the dialog primitive (mobile nav, filters, admin drawers). */
export function SheetContent({ className, children, side = "right", hideClose, ...props }: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      {side !== "full" && <Overlay />}
      <DialogPrimitive.Content
        data-lenis-prevent
        className={cn(
          "fixed z-50 flex flex-col overflow-y-auto border-line bg-canvas p-6 shadow-float",
          SHEET_SIDES[side],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && <CloseButton />}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mb-6 flex flex-col gap-2 pr-8", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-2xl font-medium tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-[15px] leading-relaxed text-ink-soft", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props} />;
}
