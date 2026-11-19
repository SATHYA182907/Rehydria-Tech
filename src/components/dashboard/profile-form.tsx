"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { yearOfStudyOptions } from "@/lib/validations/common";
import { profileSchema } from "@/lib/validations/profile";
import { updateProfile } from "@/services/student/actions";

type ProfileInput = z.input<typeof profileSchema>;
type ProfileOutput = z.output<typeof profileSchema>;

export function ProfileForm({ defaults, email }: { defaults: ProfileInput; email: string }) {
  const { register, control, handleSubmit, getValues, formState } = useForm<ProfileInput, unknown, ProfileOutput>({ resolver: zodResolver(profileSchema), defaultValues: defaults, mode: "onTouched" });
  const onSubmit = handleSubmit(async () => {
    const res = await updateProfile(getValues());
    if (res.ok) toast.success(res.message ?? "Saved");
    else toast.error(res.error);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field label="Full name" required error={formState.errors.fullName?.message} description="Used on your certificates" className="sm:col-span-2">
        <Input autoComplete="name" {...register("fullName")} />
      </Field>
      <Field label="Email address" description="Contact us to change the email on your account">
        <Input value={email} readOnly disabled />
      </Field>
      <Field label="Mobile number" required error={formState.errors.phone?.message}>
        <PhoneInput {...register("phone")} />
      </Field>
      <Field label="Current course (higher education)" required error={formState.errors.degree?.message} description="For example: B.E. Electronics & Communication">
        <Input {...register("degree")} />
      </Field>
      <Field label="College (optional)" error={formState.errors.college?.message}>
        <Input autoComplete="organization" {...register("college")} />
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
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={formState.isSubmitting}>Save changes</Button>
      </div>
    </form>
  );
}
