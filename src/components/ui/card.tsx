import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const cardVariants = cva("relative rounded-md", {
  variants: {
    variant: {
      plain: "border border-line bg-surface shadow-card",
      interactive: [
        "border border-line bg-surface shadow-card",
        "transition-[transform,border-color,box-shadow] duration-500 ease-[var(--ease-out-expo)]",
        "hover:-translate-y-1 hover:border-moss/50 hover:shadow-float",
        "focus-within:border-moss/50",
      ],
      muted: "border border-line bg-canvas-2",
      feature: "bg-gradient-to-br from-forest to-forest-deep text-on-forest",
      glass:
        "border border-white/60 bg-canvas/70 shadow-card backdrop-blur-[14px] backdrop-saturate-[1.4]",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8 md:p-10",
    },
  },
  defaultVariants: { variant: "plain", padding: "md" },
});

export interface CardProps extends ComponentProps<"div">, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div data-slot="card" className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-xl font-medium tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm leading-relaxed text-ink-soft", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-6 flex items-center gap-3 border-t border-line pt-5", className)} {...props} />;
}
