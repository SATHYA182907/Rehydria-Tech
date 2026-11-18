"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { authErrorMessage, createServerSession, safeNext } from "@/lib/auth/client-session";
import { clientAuth } from "@/lib/firebase/client";
import { registerSchema } from "@/lib/validations/auth";
import { FormAlert } from "./auth-heading";
import { GoogleButton, OrDivider } from "./google-button";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.input<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const done = () => {
    router.replace(safeNext(params.get("next")));
    router.refresh();
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const auth = await clientAuth();
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(credential.user, { displayName: values.fullName });
      await sendEmailVerification(credential.user).catch(() => undefined);
      await createServerSession(credential, { fullName: values.fullName, phone: values.phone });
      done();
    } catch (err) {
      setError(authErrorMessage(err));
    }
  });

  return (
    <div className="flex flex-col">
      {error && <div className="mb-5"><FormAlert>{error}</FormAlert></div>}
      <GoogleButton onSuccess={done} onError={setError} label="Sign up with Google" />
      <OrDivider />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Full name" required error={formState.errors.fullName?.message} description="As it should appear on your certificate">
          <Input autoComplete="name" {...register("fullName")} />
        </Field>
        <Field label="Email address" required error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Mobile number" required error={formState.errors.phone?.message}>
          <PhoneInput placeholder="98765 43210" {...register("phone")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" required error={formState.errors.password?.message}>
            <Input type="password" autoComplete="new-password" {...register("password")} />
          </Field>
          <Field label="Confirm password" required error={formState.errors.confirmPassword?.message}>
            <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
          </Field>
        </div>
        <p className="text-[13px] text-ink-soft">At least 8 characters, including a letter and a number.</p>
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-moss-text hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
