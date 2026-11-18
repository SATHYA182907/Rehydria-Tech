"use client";

import { motion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { createContext, use, useId, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const TabsContext = createContext<{ value: string | undefined; layoutId: string }>({ value: undefined, layoutId: "tabs" });

/** Tabs with an animated active indicator (Motion shared layout). */
export function Tabs({ value, defaultValue, onValueChange, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const layoutId = useId();
  return (
    <TabsContext value={{ value: current, layoutId }}>
      <TabsPrimitive.Root
        value={current}
        onValueChange={(v) => {
          setInternal(v);
          onValueChange?.(v);
        }}
        {...props}
      />
    </TabsContext>
  );
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-1 rounded-pill border border-line bg-canvas-2 p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, children, value, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const ctx = use(TabsContext);
  const active = ctx.value === value;
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "relative rounded-pill px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink data-[state=active]:text-on-forest",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss",
        className,
      )}
      {...props}
    >
      {active && (
        <motion.span
          layoutId={ctx.layoutId}
          className="absolute inset-0 rounded-pill bg-forest"
          transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
        />
      )}
      <span className="relative">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("anim-fade mt-6 focus-visible:outline-2 focus-visible:outline-moss", className)}
      {...props}
    />
  );
}
