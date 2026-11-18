"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { applyActionCode, confirmPasswordReset, sendPasswordResetEmail, verifyPasswordResetCode } from "firebase/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authErrorMessage } from "@/lib/auth/client-session";
import { clientAuth } from "@/lib/firebase/client";
import { newPasswordSchema, resetRequestSchema } from "@/lib/validations/auth";
import { FormAlert } from "./auth-heading";

/** Request a reset link. The response is identical whether or not the email exists. */
export function ResetRequestForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.input<typeof resetRequestSchema>>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await sendPasswordResetEmail(await clientAuth(), email, { url: `${window.location.origin}/login` });
      setSent(true);
    } catch (err) {
      const message = authErrorMessage(err);
      // Do not reveal whether an account exists.
      if (message === "Email or password is incorrect.") setSent(true);
      else setError(message);
    }
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert tone="success">If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.</FormAlert>
        <Button asChild variant="secondary" size="lg">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="Email address" error={formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Button type="submit" size="lg" loading={formState.isSubmitting}>
        Send reset link
      </Button>
      <Link href="/login" className="inline-flex min-h-11 items-center justify-center text-sm text-moss-text hover:underline">
        Back to log in
      </Link>
    </form>
  );
}

/**
 * Handles Firebase email action links (/account/action?mode=…&oobCode=…):
 * password reset and email verification.
 */
export function AccountActionHandler() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const code = params.get("oobCode") ?? "";
  const [state, setState] = useState<"checking" | "ready" | "done" | "error">("checking");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.input<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const auth = await clientAuth();
        if (mode === "resetPassword") {
          const addr = await verifyPasswordResetCode(auth, code);
          if (!cancelled) {
            setEmail(addr);
            setState("ready");
          }
        } else if (mode === "verifyEmail") {
          await applyActionCode(auth, code);
          if (!cancelled) setState("done");
        } else {
          throw Object.assign(new Error("Unsupported link."), { code: "auth/invalid-action-code" });
        }
      } catch (err) {
        if (!cancelled) {
          setError(authErrorMessage(err));
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, code]);

  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      await confirmPasswordReset(await clientAuth(), code, password);
      setState("done");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  });

  if (state === "checking") {
    return (
      <p className="flex items-center gap-3 text-ink-soft">
        <Spinner /> Checking your link…
      </p>
    );
  }
  if (state === "error") {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert>{error}</FormAlert>
        <Button asChild variant="secondary" size="lg">
          <Link href="/reset-password">Request a new link</Link>
        </Button>
      </div>
    );
  }
  if (state === "done") {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert tone="success">{mode === "verifyEmail" ? "Your email address is verified." : "Your password has been updated."}</FormAlert>
        <Button asChild size="lg">
          <Link href="/login">Continue to log in</Link>
        </Button>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error && <FormAlert>{error}</FormAlert>}
      {email && <p className="text-sm text-ink-soft">Setting a new password for <strong className="text-ink">{email}</strong></p>}
      <Field label="New password" error={formState.errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirm new password" error={formState.errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
      </Field>
      <Button type="submit" size="lg" loading={formState.isSubmitting}>
        Save new password
      </Button>
    </form>
  );
}
