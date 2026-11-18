import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/** Shared control styling for inputs, textareas and select triggers. */
export const controlClass = cn(
  "w-full rounded-sm border border-line-strong bg-surface px-3.5 text-base text-ink shadow-xs sm:text-[15px]",
  "placeholder:text-mute",
  "transition-[border-color,box-shadow] duration-200",
  "hover:border-ink-soft/50",
  "focus-visible:border-moss focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/60",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/15",
  "disabled:cursor-not-allowed disabled:bg-canvas-2 disabled:opacity-70",
);

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(controlClass, "h-11", className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      data-slot="textarea"
      className={cn(controlClass, "min-h-24 resize-y py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-ink", className)} {...props} />;
}
