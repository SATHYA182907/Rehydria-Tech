"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authErrorMessage, createServerSession, safeNext } from "@/lib/auth/client-session";
import { clientAuth } from "@/lib/firebase/client";
import { loginSchema } from "@/lib/validations/auth";
import { FormAlert } from "./auth-heading";
import { GoogleButton, OrDivider } from "./google-button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.input<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const done = (isAdmin: boolean) => {
    const next = params.get("next");
    router.replace(safeNext(next, isAdmin ? "/admin" : "/dashboard"));
    router.refresh();
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(await clientAuth(), values.email, values.password);
      done((await createServerSession(credential)).isAdmin);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  });

  return (
    <div className="flex flex-col">
      {error && <div className="mb-4"><FormAlert>{error}</FormAlert></div>}
      <GoogleButton onSuccess={done} onError={setError} />
      <OrDivider />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Email address" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        <div className="-my-2 flex justify-end">
          <Link href="/reset-password" className="inline-flex min-h-11 items-center text-sm text-moss-text hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          Log in
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-soft">
        New to Rehydria?{" "}
        <Link href="/enroll" className="font-medium text-moss-text hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
