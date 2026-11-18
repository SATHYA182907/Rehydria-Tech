import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know our custom @theme tokens (globals.css); otherwise it mistakes
 * `text-display-md` for a text *color* and drops it when a color class follows.
 * Keep this list in sync with the @theme block.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-xl", "display-lg", "display-md", "eyebrow"],
      shadow: ["xs", "card", "float"],
      radius: ["xs", "sm", "md", "pill"],
    },
  },
});

/** Merge conditional class names and resolve Tailwind conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
