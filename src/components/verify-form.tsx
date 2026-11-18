"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeCertificateId } from "@/shared/ids";

export function VerifyForm({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const id = normalizeCertificateId(value);
        if (!id) {
          setError("Enter a certificate ID like RHT-XXXX-XXXX-XXXX-XXXX.");
          return;
        }
        setError(null);
        router.push(`/verify/${id}`);
      }}
    >
      <label htmlFor="certificate-id" className="text-sm font-medium">
        Certificate ID
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="certificate-id"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="RHT-XXXX-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "certificate-id-error" : undefined}
          className="font-mono uppercase tracking-wider"
        />
        <Button type="submit" size="md" className="shrink-0">
          <Search aria-hidden="true" /> Verify
        </Button>
      </div>
      {error && (
        <p id="certificate-id-error" role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
