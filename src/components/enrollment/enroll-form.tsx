"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { ArrowRight, Check, Lock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormAlert } from "@/components/auth/auth-heading";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { RadioCard, RadioCards } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authErrorMessage, createServerSession, useSignedInHint } from "@/lib/auth/client-session";
import { clientAuth } from "@/lib/firebase/client";
import { yearOfStudyOptions } from "@/lib/validations/common";
import { enrollmentDetailsSchema, enrollmentSignupSchema, type EnrollmentSignupInput } from "@/lib/validations/enrollment";
import { createEnrollmentApplication } from "@/services/enrollment/actions";

export interface EnrollCourseOption {
  id: string;
  slug: string;
  title: string;
  durationLabel: string;
}

const STEPS = ["Your details", "Payment", "Start learning"];

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Enrollment steps">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span
            aria-current={i === current ? "step" : undefined}
            className={
              i < current
                ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-moss text-white"
                : i === current
                  ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-forest font-mono text-xs text-mint"
                  : "flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-xs text-ink-soft"
            }
          >
            {i < current ? <Check aria-hidden="true" className="size-4" /> : i + 1}
          </span>
          <span className={i === current ? "text-sm font-medium text-ink" : "hidden text-sm text-ink-soft sm:inline"}>{s}</span>
          {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px flex-1 bg-line-strong" />}
        </li>
      ))}
    </ol>
  );
}

export { Stepper };

/**
 * Enrollment application: account + details in one form. Visitors create their account here
 * (email/password); signed-in students only confirm their details. On success the
 * application is saved as "pending payment" and the student continues to payment.
 */
export function EnrollForm({ courses }: { courses: EnrollCourseOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const signedIn = Boolean(useSignedInHint());
  const reduce = useReducedMotion();
  const [error, setError] = useState<{ text: string; loginHint?: boolean } | null>(null);
  const preselected = courses.find((c) => c.slug === params.get("course") || c.id === params.get("course"))?.id ?? courses[0]?.id ?? "";

  const { register, control, handleSubmit, formState, getValues } = useForm<EnrollmentSignupInput>({
    // Signed-in students skip email/password, so validate only the details.
    resolver: zodResolver(signedIn ? (enrollmentDetailsSchema as unknown as typeof enrollmentSignupSchema) : enrollmentSignupSchema),
    defaultValues: { fullName: "", email: "", phone: "", degree: "", courseId: preselected, password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async () => {
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
      setError({ text, loginHint: text.startsWith("An account with this email already exists") });
    }
  });

  const loginHref = `/login?next=${encodeURIComponent(`/enroll?course=${courses.find((c) => c.id === getValues().courseId)?.slug ?? ""}`)}`;
  const item = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } });

  return (
    <div>
      <Stepper current={0} />
      {!signedIn && (
        <>
          <GoogleButton label="Sign up with Google" onSuccess={() => router.refresh()} onError={(text) => setError({ text })} />
          <p className="mt-2 text-center text-[13px] text-ink-soft">Then complete your details below.</p>
          <OrDivider />
        </>
      )}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        {error && (
          <FormAlert>
            {error.text}{" "}
            {error.loginHint && (
              <Link href={loginHref} className="font-medium underline">
                Log in to continue
              </Link>
            )}
          </FormAlert>
        )}

        <motion.fieldset {...item(0)} className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium">
            Preferred internship course<span aria-hidden="true" className="ml-0.5 text-moss">*</span>
          </legend>
          <Controller
            control={control}
            name="courseId"
            render={({ field }) => (
              <RadioCards value={field.value} onValueChange={field.onChange}>
                {courses.map((c) => (
                  <RadioCard key={c.id} value={c.id} title={c.title} meta={c.durationLabel} />
                ))}
              </RadioCards>
            )}
          />
          {e.courseId && <p className="text-[13px] font-medium text-danger">{e.courseId.message}</p>}
        </motion.fieldset>

        <motion.div {...item(1)} className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required error={e.fullName?.message} description="As it should appear on your certificate" className="sm:col-span-2">
            <Input autoComplete="name" {...register("fullName")} />
          </Field>
          {!signedIn && (
            <Field label="Email address" required error={e.email?.message} className="sm:col-span-2">
              <Input type="email" autoComplete="email" {...register("email")} />
            </Field>
          )}
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
          <Field label="Current course (higher education)" required error={e.degree?.message} description="For example: B.E. Electronics & Communication" className="sm:col-span-2">
            <Input autoComplete="off" {...register("degree")} />
          </Field>
        </motion.div>

        {!signedIn && (
          <motion.div {...item(2)} className="grid gap-5 sm:grid-cols-2">
            <Field label="Create password" required error={e.password?.message} description="At least 8 characters, with a letter and a number">
              <Input type="password" autoComplete="new-password" {...register("password")} />
            </Field>
            <Field label="Confirm password" required error={e.confirmPassword?.message}>
              <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
            </Field>
          </motion.div>
        )}

        <motion.div {...item(3)} className="flex flex-col gap-4">
          <Button type="submit" size="lg" loading={formState.isSubmitting}>
            {signedIn ? "Continue to payment" : "Create account & continue"} <ArrowRight aria-hidden="true" />
          </Button>
          <p className="flex items-center justify-center gap-2 text-center text-[13px] text-ink-soft">
            <Lock aria-hidden="true" className="size-3.5" /> Your course is activated only after payment is confirmed.
          </p>
          {!signedIn && (
            <p className="text-center text-sm text-ink-soft">
              Already have an account?{" "}
              <Link href={loginHref} className="inline-flex min-h-11 items-center font-medium text-moss-text hover:underline">
                Log in
              </Link>
            </p>
          )}
        </motion.div>
      </form>
    </div>
  );
}
