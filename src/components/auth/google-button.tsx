"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authErrorMessage, createServerSession } from "@/lib/auth/client-session";
import { clientAuth } from "@/lib/firebase/client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.5c2.1-1.9 3.3-4.8 3.3-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7H2.1v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 13.9a6.6 6.6 0 0 1 0-4.2V6.8H2.1a11 11 0 0 0 0 9.9l3.6-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 6.8l3.6 2.9C6.6 7.4 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

export function GoogleButton({ onSuccess, onError, label = "Continue with Google" }: { onSuccess: (isAdmin: boolean) => void; onError: (message: string) => void; label?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const credential = await signInWithPopup(await clientAuth(), new GoogleAuthProvider());
          const { isAdmin } = await createServerSession(credential);
          onSuccess(isAdmin);
        } catch (err) {
          onError(authErrorMessage(err));
          setLoading(false);
        }
      }}
    >
      <GoogleMark />
      {label}
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
