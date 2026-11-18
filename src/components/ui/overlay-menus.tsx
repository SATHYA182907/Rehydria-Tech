"use client";

import { DropdownMenu as DropdownPrimitive, Tooltip as TooltipPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/* ── Tooltip ─────────────────────────────────────────────────────────────── */

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, sideOffset = 6, children, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "anim-pop z-50 max-w-xs rounded-xs bg-forest-deep px-2.5 py-1.5 text-xs font-medium text-on-forest shadow-float",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-forest-deep" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

/* ── Dropdown menu ───────────────────────────────────────────────────────── */

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

export function DropdownMenuContent({ className, sideOffset = 8, align = "end", ...props }: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        data-lenis-prevent
        className={cn(
          "anim-pop z-50 min-w-52 overflow-hidden rounded-sm border border-line bg-surface p-1.5 shadow-float",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  tone = "default",
  ...props
}: ComponentProps<typeof DropdownPrimitive.Item> & { tone?: "default" | "danger" }) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center gap-2.5 rounded-xs px-2.5 py-2 text-[15px] outline-none select-none [&_svg]:size-4 [&_svg]:text-ink-soft",
        "data-[highlighted]:bg-mint-soft data-[highlighted]:text-forest data-[highlighted]:[&_svg]:text-forest data-[disabled]:opacity-50",
        tone === "danger" && "text-danger data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn("px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Separator>) {
  return <DropdownPrimitive.Separator className={cn("my-1.5 h-px bg-line", className)} {...props} />;
}
