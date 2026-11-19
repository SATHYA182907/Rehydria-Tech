"use client";

import { Lock, Unlock } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Unlock animation for an earned certificate: a padlock opens and fades, then the
 * certificate rises in with a soft sheen. On fine pointers the card tilts subtly.
 */
export function CertificateReveal({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 150, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 20 });
  const delay = 0.2 + index * 0.15;

  return (
    <div className="relative [perspective:1200px]">
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: delay + 0.7, duration: 0.4 }}
        >
          <motion.span
            className="flex size-16 items-center justify-center rounded-full bg-forest text-mint shadow-float"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.15, 0.6] }}
            transition={{ delay, duration: 1, ease: EASE }}
          >
            <motion.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: delay + 0.3, duration: 0.15 }} className="absolute">
              <Lock className="size-7" />
            </motion.span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3, duration: 0.15 }} className="absolute">
              <Unlock className="size-7" />
            </motion.span>
          </motion.span>
        </motion.div>
      )}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ delay: reduce ? 0 : delay + 0.6, duration: 1, ease: EASE }}
        style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          if (reduce || e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="relative overflow-hidden rounded-sm shadow-float"
      >
        {children}
        {!reduce && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            initial={{ x: "0%" }}
            animate={{ x: "450%" }}
            transition={{ delay: delay + 1.4, duration: 1.4, ease: "easeInOut" }}
          />
        )}
      </motion.div>
    </div>
  );
}
