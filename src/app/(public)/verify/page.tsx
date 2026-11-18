import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Accent, Container, Section } from "@/components/layout/section";
import { VerifyForm } from "@/components/verify-form";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Check whether a Rehydria Technology certificate is genuine using its certificate ID.",
  alternates: { canonical: "/verify" },
};

export default function VerifyLandingPage() {
  return (
    <main>
      <PageHero
        eyebrow="Certificate verification"
        title={
          <>
            Verify a <Accent className="text-moss">certificate</Accent>.
          </>
        }
        lead="Every Rehydria certificate has a unique ID and QR code. Enter the ID to confirm it is genuine."
      />
      <Section spacing="compact">
        <Container className="max-w-2xl">
          <div className="rounded-md border border-line bg-surface p-6 shadow-card md:p-8">
            <VerifyForm />
          </div>
        </Container>
      </Section>
    </main>
  );
}
