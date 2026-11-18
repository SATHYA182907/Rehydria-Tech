import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { RegisterForm } from "@/components/auth/register-form";
import { Accent } from "@/components/layout/section";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <>
      <AuthHeading eyebrow="Create account" title={<>Start <Accent className="text-moss">building</Accent>.</>}>
        One account for your internships, assessments, certificates and guide purchases.
      </AuthHeading>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
