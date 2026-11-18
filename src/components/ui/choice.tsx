"use client";

import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive, RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer flex size-5 shrink-0 items-center justify-center rounded-xs border border-line-strong bg-surface shadow-xs",
        "transition-colors data-[state=checked]:border-forest data-[state=checked]:bg-forest data-[state=checked]:text-on-forest",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss aria-invalid:border-danger",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export const RadioCards = function RadioCards({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-3 sm:grid-cols-2", className)} {...props} />;
};

interface RadioCardProps extends Omit<ComponentProps<typeof RadioGroupPrimitive.Item>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
}

/** Large selectable card, used for course selection in enrollment. */
export function RadioCard({ className, title, description, meta, ...props }: RadioCardProps) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "group relative flex flex-col items-start gap-1 rounded-md border border-line-strong bg-surface p-4 text-left shadow-xs",
        "transition-[border-color,box-shadow,background-color] duration-200 hover:border-moss/60",
        "data-[state=checked]:border-forest data-[state=checked]:bg-mint-soft/50 data-[state=checked]:shadow-[0_0_0_1px_var(--color-forest)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className="font-medium text-ink">{title}</span>
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong transition-colors group-data-[state=checked]:border-forest group-data-[state=checked]:bg-forest"
        >
          <span className="size-2 rounded-full bg-on-forest opacity-0 group-data-[state=checked]:opacity-100" />
        </span>
      </span>
      {description && <span className="text-sm text-ink-soft">{description}</span>}
      {meta && <span className="mt-2 font-mono text-xs text-moss">{meta}</span>}
    </RadioGroupPrimitive.Item>
  );
}
