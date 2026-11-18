import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out-expo)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss",
    "disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-wait",
    "active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "rounded-pill bg-forest text-on-forest shadow-xs hover:bg-forest-deep",
        secondary:
          "rounded-pill border border-line-strong bg-surface/60 text-ink backdrop-blur-sm hover:border-forest hover:bg-surface",
        mint: "rounded-pill bg-mint text-forest-deep hover:bg-[#a6dbbb]",
        ghost: "rounded-sm text-ink hover:bg-canvas-2",
        "on-forest": "rounded-pill bg-canvas text-forest hover:bg-mint",
        link: "rounded-xs px-0! h-auto! text-moss underline-offset-4 hover:underline",
        danger: "rounded-pill bg-danger text-white hover:bg-[#912018]",
      },
      size: {
        sm: "h-9 px-4 text-sm [&_svg]:size-4",
        md: "h-11 px-6 text-[15px] [&_svg]:size-[18px]",
        lg: "h-14 px-8 text-base [&_svg]:size-5",
        icon: "size-10 rounded-pill [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Render the single child element (e.g. next/link) with button styles. */
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner className="absolute" />}
          <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>{children}</span>
        </>
      )}
    </Comp>
  );
}
