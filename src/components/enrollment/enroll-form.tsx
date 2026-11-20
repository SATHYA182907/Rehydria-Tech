"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormAlert } from "@/components/auth/auth-heading";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authErrorMessage, createServerSession, useSignedInHint } from "@/lib/auth/client-session";
import { clientAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils/cn";
import { yearOfStudyOptions } from "@/lib/validations/common";
import { enrollmentDetailsSchema, enrollmentSignupSchema, type EnrollmentSignupInput } from "@/lib/validations/enrollment";
import { createEnrollmentApplication } from "@/services/enrollment/actions";

export interface EnrollCourseOption {
  id: string;
  slug: string;
  title: string;
  durationLabel: string;
}

const STEPS = ["Account", "Details", "Payment"];
const EASE = [0.16, 1, 0.3, 1] as const;

/** Compact progress indicator shared by the enrollment form and the payment page. */
export function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-5 flex items-center gap-2 [@media(max-height:820px)]:mb-4" aria-label="Enrollment steps">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
          <span
            aria-current={i === current ? "step" : undefined}
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition-colors duration-500",
              i < current ? "bg-moss text-white" : i === current ? "bg-forest text-mint" : "border border-line-strong text-ink-soft",
            )}
          >
            {i < current ? <Check aria-hidden="true" className="size-3.5" /> : i + 1}
          </span>
          <span className={cn("text-sm", i === current ? "font-medium text-ink" : "text-ink-soft")}>{s}</span>
          {i < STEPS.length - 1 && (
            <span aria-hidden="true" className="relative h-px flex-1 overflow-hidden bg-line-strong">
              <span className={cn("absolute inset-0 origin-left bg-moss transition-transform duration-700", i < current ? "scale-x-100" : "scale-x-0")} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

type Step = "account" | "details";
const ACCOUNT_FIELDS = ["email", "password", "confirmPassword"] as const;

/**
 * Enrollment application in two short steps so each fits on one screen:
 *   1. Account: Google sign-up, or email + password (the account is created at the end)
 *   2. Details: preferred course, name, phone, year, current degree
 * Signed-in students start at step 2. On success the application is saved as "pending
 * payment" and the student continues to the payment step.
 */
export function EnrollForm({ courses }: { courses: EnrollCourseOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const signedIn = Boolean(useSignedInHint());
  const reduce = useReducedMotion();
  const [stepState, setStep] = useState<Step>("account");
  const step: Step = signedIn ? "details" : stepState;
  const [error, setError] = useState<{ text: string; loginHint?: boolean } | null>(null);
  const preselected = courses.find((c) => c.slug === params.get("course") || c.id === params.get("course"))?.id ?? courses[0]?.id ?? "";

  const { register, control, handleSubmit, formState, getValues, trigger } = useForm<EnrollmentSignupInput>({
    // Signed-in students skip email/password, so validate only the details.
    resolver: zodResolver(signedIn ? (enrollmentDetailsSchema as unknown as typeof enrollmentSignupSchema) : enrollmentSignupSchema),
    defaultValues: { fullName: "", email: "", phone: "", degree: "", courseId: preselected, password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const e = formState.errors;

  const toDetails = async () => {
    setError(null);
    if (await trigger([...ACCOUNT_FIELDS])) setStep("details");
  };

  const onSubmit = handleSubmit(
    async () => {
      setError(null);
      const v = getValues();
      try {
        if (!signedIn) {
          const auth = await clientAuth();
          const credential = await createUserWithEmailAndPassword(auth, v.email, v.password);
          await updateProfile(credential.user, { displayName: v.fullName });
          await sendEmailVerification(credential.user).catch(() => undefined);
          await createServerSession(credential, { fullName: v.fullName, phone: v.phone });
        }
        const res = await createEnrollmentApplication({ fullName: v.fullName, phone: v.phone, degree: v.degree, yearOfStudy: v.yearOfStudy, courseId: v.courseId });
        if (!res.ok) {
          setError({ text: res.error });
          return;
        }
        router.push(res.status === "pending_payment" ? `/enroll/payment?id=${encodeURIComponent(res.enrollmentId)}` : `/dashboard/courses/${res.courseId}`);
        router.refresh();
      } catch (err) {
        const text = authErrorMessage(err);
        const exists = text.startsWith("An account with this email already exists");
        setError({ text, loginHint: exists });
        if (exists) setStep("account");
      }
    },
    // An invalid account field (e.g. edited email) sends the student back to step 1.
    (errs) => {
      if (!signedIn && ACCOUNT_FIELDS.some((f) => errs[f])) setStep("account");
    },
  );

  const loginHref = `/login?next=${encodeURIComponent(`/enroll?course=${courses.find((c) => c.id === getValues().courseId)?.slug ?? ""}`)}`;
  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: step === "details" ? 32 : -32 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: step === "details" ? -32 : 32 } };

  return (
    <div>
      <Stepper current={step === "account" ? 0 : 1} />
      {error && (
        <div className="mb-4">
          <FormAlert>
            {error.text}{" "}
            {error.loginHint && (
              <Link href={loginHref} className="font-medium underline">
                Log in to continue
              </Link>
            )}
          </FormAlert>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <AnimatePresence mode="wait" initial={false}>
          {step === "account" ? (
            <motion.div key="account" {...slide} transition={{ duration: 0.35, ease: EASE }} className="flex flex-col gap-4 [@media(max-height:820px)]:gap-3">
              <GoogleButton label="Sign up with Google" onSuccess={() => router.refresh()} onError={(text) => setError({ text })} />
              <OrDivider />
              <Field label="Email address" required error={e.email?.message}>
                <Input type="email" autoComplete="email" {...register("email")} />
              </Field>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Field label="Create password" required error={e.password?.message}>
                  <Input type="password" autoComplete="new-password" placeholder="8+ characters" {...register("password")} />
                </Field>
                <Field label="Confirm password" required error={e.confirmPassword?.message}>
                  <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
                </Field>
              </div>
              <Button type="button" size="lg" className="mt-1" onClick={toDetails}>
                Continue <ArrowRight aria-hidden="true" />
              </Button>
              <p className="text-center text-sm text-ink-soft">
                Already have an account?{" "}
                <Link href={loginHref} className="font-medium text-moss-text hover:underline">
                  Log in
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="details" {...slide} transition={{ duration: 0.35, ease: EASE }} className="flex flex-col gap-4 [@media(max-height:820px)]:gap-3">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">
                  Preferred internship course<span aria-hidden="true" className="ml-0.5 text-moss">*</span>
                </legend>
                <Controller
                  control={control}
                  name="courseId"
                  render={({ field }) => (
                    <div role="radiogroup" aria-label="Preferred internship course" className="grid grid-cols-2 gap-2.5">
                      {courses.map((c) => {
                        const checked = field.value === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            onClick={() => field.onChange(c.id)}
                            className={cn(
                              "relative flex flex-col items-start gap-1 rounded-sm border px-3.5 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-200",
                              checked ? "border-forest bg-mint-soft/60 shadow-[0_0_0_1px_var(--color-forest)]" : "border-line-strong bg-surface hover:border-moss/60",
                            )}
                          >
                            <span className="pr-6 text-sm leading-snug font-medium">{c.title}</span>
                            <span className="font-mono text-[11px] text-moss-text">{c.durationLabel}</span>
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute top-2.5 right-2.5 flex size-4 items-center justify-center rounded-full border transition-colors",
                                checked ? "border-forest bg-forest" : "border-line-strong",
                              )}
                            >
                              {checked && <span className="size-1.5 rounded-full bg-on-forest" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {e.courseId && <p className="text-[13px] font-medium text-danger">{e.courseId.message}</p>}
              </fieldset>
              <Field label="Full name" required error={e.fullName?.message}>
                <Input autoComplete="name" placeholder="As it should appear on your certificate" {...register("fullName")} />
              </Field>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Field label="Phone number" required error={e.phone?.message}>
                  <PhoneInput placeholder="98765 43210" {...register("phone")} />
                </Field>
                <Field label="Year of study" required error={e.yearOfStudy?.message}>
                  {(p) => (
                    <Controller
                      control={control}
                      name="yearOfStudy"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger {...p} onBlur={field.onBlur}>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOfStudyOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                </Field>
              </div>
              <Field label="Current course (higher education)" required error={e.degree?.message}>
                <Input autoComplete="off" placeholder="e.g. B.E. Electronics & Communication" {...register("degree")} />
              </Field>
              <div className="mt-1 flex gap-3">
                {!signedIn && (
                  <Button type="button" size="lg" variant="secondary" onClick={() => setStep("account")} aria-label="Back to account">
                    <ArrowLeft aria-hidden="true" />
                  </Button>
                )}
                <Button type="submit" size="lg" className="flex-1" loading={formState.isSubmitting}>
                  {signedIn ? "Continue to payment" : "Create account & continue"} <ArrowRight aria-hidden="true" />
                </Button>
              </div>
              <p className="flex items-center justify-center gap-2 text-center text-[13px] text-ink-soft">
                <Lock aria-hidden="true" className="size-3.5" /> Your course is activated only after payment is confirmed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
