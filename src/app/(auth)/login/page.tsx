import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";
import { Accent } from "@/components/layout/section";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <AuthHeading eyebrow="Student login" title={<>Welcome <Accent className="text-moss">back</Accent>.</>}>
        Log in to continue your courses, assessments and certificates.
      </AuthHeading>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
