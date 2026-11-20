"use client";

import { ArrowRight, CreditCard, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { continueWithoutPayment } from "@/services/enrollment/actions";
import { Stepper } from "./enroll-form";

/**
 * Checkout panel. No payment is taken or simulated. While no gateway is configured
 * (preview mode) the student can start the course straight away; the enrollment is
 * marked so it can be reconciled once payments go live.
 */
export function PaymentPending({ fee, enrollmentId, previewMode }: { fee: string; enrollmentId: string; previewMode: boolean }) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [pending, start] = useTransition();
  const startNow = () =>
    start(async () => {
      const res = await continueWithoutPayment(enrollmentId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("You're in! Your course is unlocked.");
      router.push(`/dashboard/courses/${res.courseId}`);
    });
  return (
    <div className="flex flex-col gap-6">
      <Stepper current={2} />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-md bg-gradient-to-br from-forest to-forest-deep p-6 text-on-forest shadow-float sm:p-8"
      >
        <div aria-hidden="true" className="absolute inset-0 [background-image:radial-gradient(rgb(184_228_201/0.12)_1px,transparent_1px)] [background-size:20px_20px]" />
        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["0%", "450%"] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
          />
        )}
        <div className="relative flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mint">
              <ShieldCheck aria-hidden="true" className="size-4" /> Secure checkout
            </span>
            <CreditCard aria-hidden="true" className="size-6 text-mint" />
          </div>
          <div>
            <p className="text-sm text-on-forest-soft">Amount</p>
            <p className="text-3xl font-medium tracking-tight">{fee}</p>
          </div>
          <div className="flex items-start gap-3 rounded-sm bg-white/10 p-4 text-sm">
            <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
            <p>
              {previewMode
                ? "Online payment is being connected. Until then you can start your course right away; no payment is needed in this preview."
                : "Online payment is being connected. Your application is saved; we'll notify you as soon as you can complete payment and start learning."}
            </p>
          </div>
        </div>
      </motion.div>
      {previewMode ? (
        <div className="flex flex-col gap-3">
          <Button size="lg" loading={pending} onClick={startNow}>
            Start learning now <ArrowRight aria-hidden="true" />
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/dashboard/courses">
              <LayoutDashboard aria-hidden="true" /> Go to my dashboard
            </Link>
          </Button>
        </div>
      ) : (
        <Button asChild size="lg">
          <Link href="/dashboard/courses">
            <LayoutDashboard aria-hidden="true" /> Go to my dashboard
          </Link>
        </Button>
      )}
    </div>
  );
}
