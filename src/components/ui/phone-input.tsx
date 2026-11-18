import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { controlClass } from "./input";

/**
 * Indian mobile number input with a fixed +91 prefix. The value is the 10-digit national
 * number; normalize to E.164 with `toE164India()` from `@/lib/validations/common`.
 */
export function PhoneInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <div className={cn("relative flex", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 border-r border-line pr-3 pl-3.5 font-mono text-sm text-ink-soft"
      >
        +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={16}
        data-slot="input"
        className={cn(controlClass, "h-11 pl-[4.25rem] tracking-wide")}
        {...props}
      />
    </div>
  );
}
