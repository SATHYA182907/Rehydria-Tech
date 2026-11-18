"use client";

import { Plus } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-b border-line", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-6 py-6 text-left text-lg font-medium tracking-tight transition-colors hover:text-moss md:text-xl",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss",
          className,
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line-strong transition-[transform,background-color,border-color,color] duration-500 ease-[var(--ease-out-expo)] group-data-[state=open]:rotate-45 group-data-[state=open]:border-forest group-data-[state=open]:bg-forest group-data-[state=open]:text-on-forest"
        >
          <Plus className="size-4" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className="anim-accordion overflow-hidden" {...props}>
      <div className={cn("max-w-[68ch] pb-6 text-[15px] leading-relaxed text-ink-soft md:text-base", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}
