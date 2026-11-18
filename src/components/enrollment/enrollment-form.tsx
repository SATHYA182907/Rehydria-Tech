"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Lock } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormAlert } from "@/components/auth/auth-heading";
import { Button } from "@/components/ui/button";
import { RadioCard, RadioCards } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPaise } from "@/shared/money";
import { yearOfStudyOptions } from "@/lib/validations/common";
import { enrollmentSchema, type EnrollmentInput } from "@/lib/validations/enrollment";
import { startEnrollment } from "@/services/enrollment/actions";

interface EnrollmentFormProps {
  courses: { id: string; title: string; durationLabel: string; pricePaise: number }[];
  defaultCourseId: string;
  paymentsEnabled: boolean;
}

export function EnrollmentForm({ courses, defaultCourseId, paymentsEnabled }: EnrollmentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { register, control, handleSubmit, formState } = useForm<EnrollmentInput>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: { fullName: "", email: "", phone: "", courseId: defaultCourseId, college: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await startEnrollment(values);
    if (!result.ok) setError(result.error);
    // Phase 7: on success open Razorpay Checkout with result.orderId.
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {!paymentsEnabled && (
        <p role="status" className="flex gap-3 rounded-sm border border-line bg-canvas-2 px-4 py-3 text-sm text-ink-soft">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-moss" />
          Online payments are being activated. You can review the form now; enrollment opens as soon as checkout is live.
        </p>
      )}
      {error && <FormAlert>{error}</FormAlert>}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">
          Program<span aria-hidden="true" className="ml-0.5 text-moss">*</span>
        </legend>
        <Controller
          control={control}
          name="courseId"
          render={({ field }) => (
            <RadioCards value={field.value} onValueChange={field.onChange}>
              {courses.map((c) => (
                <RadioCard key={c.id} value={c.id} title={c.title} meta={`${c.durationLabel} · ${formatPaise(c.pricePaise)}`} />
              ))}
            </RadioCards>
          )}
        />
        {formState.errors.courseId && <p className="text-[13px] font-medium text-danger">{formState.errors.courseId.message}</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required error={formState.errors.fullName?.message} description="As it should appear on your certificate" className="sm:col-span-2">
          <Input autoComplete="name" {...register("fullName")} />
        </Field>
        <Field label="Email address" required error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Phone number" required error={formState.errors.phone?.message}>
          <PhoneInput placeholder="98765 43210" {...register("phone")} />
        </Field>
        <Field label="Year of study" required error={formState.errors.yearOfStudy?.message}>
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
        <Field label="College or organization" required error={formState.errors.college?.message}>
          <Input autoComplete="organization" {...register("college")} />
        </Field>
      </div>

      <Button type="submit" size="lg" loading={formState.isSubmitting} disabled={!paymentsEnabled}>
        <Lock aria-hidden="true" />
        {paymentsEnabled ? "Continue to secure payment" : "Enrollment opens soon"}
      </Button>
      <p className="text-center text-[13px] text-ink-soft">Payments are processed securely by Razorpay. Access activates only after your payment is verified.</p>
    </form>
  );
}
