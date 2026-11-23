"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authErrorMessage, createServerSession, safeNext, useSignedInHint } from "@/lib/auth/client-session";
import { clientAuth } from "@/lib/firebase/client";
import { loginSchema } from "@/lib/validations/auth";
import { FormAlert } from "./auth-heading";
import { GoogleButton, OrDivider } from "./google-button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hint = useSignedInHint();
  // The hint cookie can outlive the session: confirm with the server before offering a shortcut.
  const [confirmed, setConfirmed] = useState<{ isAdmin: boolean } | null>(null);
  useEffect(() => {
    if (!hint) return;
    let live = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ signedIn?: boolean; isAdmin?: boolean }>)
      .then((d) => live && setConfirmed(d.signedIn ? { isAdmin: d.isAdmin === true } : null))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [hint]);
  const signedIn = confirmed ? (confirmed.isAdmin ? "admin" : "student") : null;
  const { register, handleSubmit, formState } = useForm<z.input<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  /** Go where the student was headed; otherwise straight into their course (server-computed). */
  const done = (isAdmin: boolean, landing: string) => {
    const next = params.get("next");
    const target = next && next !== "/dashboard" ? safeNext(next, landing) : isAdmin ? "/admin" : landing;
    router.replace(target);
    router.refresh();
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(await clientAuth(), values.email, values.password);
      const session = await createServerSession(credential);
      done(session.isAdmin, session.landing);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  });

  return (
    <div className="flex flex-col">
      {signedIn && !error && (
        <div className="mb-4">
          <FormAlert tone="success">
            You&apos;re already signed in.{" "}
            <Link href={signedIn === "admin" ? "/admin" : "/dashboard"} className="font-medium underline">
              Continue to {signedIn === "admin" ? "the admin area" : "your course"}
            </Link>
          </FormAlert>
        </div>
      )}
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
