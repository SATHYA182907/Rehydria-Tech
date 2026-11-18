import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetRequestForm } from "@/components/auth/reset-forms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading eyebrow="Account recovery" title="Reset your password">
        Enter the email you registered with and we&apos;ll send you a link to choose a new password.
      </AuthHeading>
      <ResetRequestForm />
    </>
  );
}
