"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/lib/actions/auth-actions";

export function VerifyEmailButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setStatus("loading");
    try {
      const result = await verifyEmail(token);
      if (result.success) {
        setStatus("success");
      } else {
        setError(result.error || "Verification failed");
        setStatus("error");
      }
    } catch {
      setError("An unexpected error occurred");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div>
        <p className="mb-4 text-green-600 dark:text-green-400">
          ✓ Email confirmed — an administrator will review and approve your account.
        </p>
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div>
        <p className="mb-4 text-destructive">{error}</p>
        <Link
          href="/register"
          className="text-sm text-primary hover:underline"
        >
          Register again
        </Link>
      </div>
    );
  }

  return (
    <Button onClick={handleVerify} disabled={status === "loading"}>
      {status === "loading" ? "Verifying..." : "Confirm My Email"}
    </Button>
  );
}
