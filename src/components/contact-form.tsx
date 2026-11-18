"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { FormAlert } from "@/components/auth/auth-heading";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { contactSchema, contactTopics } from "@/lib/validations/contact";
import { submitContactMessage } from "@/services/contact/actions";

export function ContactForm() {
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const { register, control, handleSubmit, reset, formState } = useForm<z.input<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullName: "", email: "", phone: "", message: "", website: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    const result = await submitContactMessage(values);
    if (result.ok) {
      reset();
      setStatus({ tone: "success", text: "Thanks! Your message has been received. We'll get back to you by email." });
    } else {
      setStatus({ tone: "error", text: result.error });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      {status && (
        <div className="sm:col-span-2">
          <FormAlert tone={status.tone}>{status.text}</FormAlert>
        </div>
      )}
      <Field label="Full name" required error={formState.errors.fullName?.message}>
        <Input autoComplete="name" {...register("fullName")} />
      </Field>
      <Field label="Email address" required error={formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Phone (optional)" error={formState.errors.phone?.message}>
        <Input type="tel" autoComplete="tel" {...register("phone")} />
      </Field>
      <Field label="Topic" required error={formState.errors.topic?.message}>
        {(p) => (
          <Controller
            control={control}
            name="topic"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger {...p} onBlur={field.onBlur}>
                  <SelectValue placeholder="What is this about?" />
                </SelectTrigger>
                <SelectContent>
                  {contactTopics.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
      <Field label="Message" required error={formState.errors.message?.message} className="sm:col-span-2">
        <Textarea rows={6} {...register("message")} />
      </Field>
      {/* Honeypot for bots: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          <Send aria-hidden="true" /> Send message
        </Button>
      </div>
    </form>
  );
}
