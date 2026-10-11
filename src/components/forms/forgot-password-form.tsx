"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, resendVerification } from "@/lib/actions/auth-actions";

export function ForgotPasswordForm({ verification = false }: { verification?: boolean }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    try {
      const result = await (verification ? resendVerification : requestPasswordReset)(formData);
      if (result.success) setSuccess(true);
      else setError(result.error || "Unable to send email");
    } catch {
      setError("Unable to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div role="status" className="rounded-md bg-green-50 px-4 py-6 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <p className="text-sm">
            We&apos;ve sent account guidance to your email address. Please check your inbox.
          </p>
        </div>
        <Link href="/login" className="text-sm text-gold-deep dark:text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void handleSubmit(new FormData(event.currentTarget)); }} aria-busy={loading} className="space-y-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <p role="status" className="sr-only">{loading ? "Sending email..." : ""}</p>
      <Button type="submit" className="w-full bg-gold-deep dark:bg-primary" disabled={loading}>
        {loading ? "Sending..." : verification ? "Resend Verification Email" : "Send Reset Link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-gold-deep dark:text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
