"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox, RadioCard, RadioCards } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  emailSchema,
  fullNameSchema,
  indianMobileSchema,
  organizationSchema,
  yearOfStudyOptions,
  yearOfStudySchema,
} from "@/lib/validations/common";

/**
 * Showcase form: exercises every form primitive with the shared validation schemas.
 * It performs client-side validation only and sends nothing anywhere.
 */
const demoSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: indianMobileSchema,
  yearOfStudy: yearOfStudySchema,
  college: organizationSchema,
  track: z.enum(["a", "b"], { error: "Choose a track." }),
  consent: z.literal(true, { error: "Please accept to continue." }),
});

type DemoInput = z.input<typeof demoSchema>;

export function DemoForm() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DemoInput>({
    resolver: zodResolver(demoSchema),
    defaultValues: { fullName: "", email: "", phone: "", college: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 900));
    toast.success("All fields are valid", { description: "Showcase only: nothing was submitted." });
    reset();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field label="Full name" required error={errors.fullName?.message}>
        <Input autoComplete="name" placeholder="As it should appear on your certificate" {...register("fullName")} />
      </Field>
      <Field label="Email address" required error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="you@college.edu" {...register("email")} />
      </Field>
      <Field label="Phone number" required error={errors.phone?.message} description="10-digit mobile number">
        <PhoneInput placeholder="98765 43210" {...register("phone")} />
      </Field>
      <Field label="Year of study" required error={errors.yearOfStudy?.message}>
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
      <Field label="College or organization" required error={errors.college?.message} className="sm:col-span-2">
        <Input autoComplete="organization" {...register("college")} />
      </Field>
      <fieldset className="flex flex-col gap-2 sm:col-span-2">
        <legend className="mb-2 text-sm font-medium">
          Track<span aria-hidden="true" className="ml-0.5 text-moss">*</span>
        </legend>
        <Controller
          control={control}
          name="track"
          render={({ field }) => (
            <RadioCards value={field.value} onValueChange={field.onChange} aria-invalid={!!errors.track}>
              <RadioCard value="a" title="Sample track A" description="Radio card with description" meta="SAMPLE · 6 WEEKS" />
              <RadioCard value="b" title="Sample track B" description="Selected state uses a forest ring" meta="SAMPLE · 4 WEEKS" />
            </RadioCards>
          )}
        />
        {errors.track && <p className="text-[13px] font-medium text-danger">{errors.track.message}</p>}
      </fieldset>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                checked={field.value === true}
                onCheckedChange={(v) => field.onChange(v === true ? true : undefined)}
                aria-invalid={!!errors.consent}
                className="mt-0.5"
              />
            )}
          />
          I understand this is a component showcase and nothing will be submitted.
        </label>
        {errors.consent && <p className="text-[13px] font-medium text-danger">{errors.consent.message}</p>}
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" loading={isSubmitting}>
          Validate form
        </Button>
        <Button type="button" variant="secondary" onClick={() => reset()}>
          Reset
        </Button>
      </div>
    </form>
  );
}
