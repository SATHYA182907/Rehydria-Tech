import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AccountActionHandler } from "@/components/auth/reset-forms";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function AccountActionPage() {
  return (
    <>
      <AuthHeading eyebrow="Account" title="Secure account link" />
      <Suspense>
        <AccountActionHandler />
      </Suspense>
    </>
  );
}
