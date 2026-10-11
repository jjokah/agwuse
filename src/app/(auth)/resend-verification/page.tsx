import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = { title: "Resend Verification" };
export default function ResendVerificationPage() {
  return <Card>
    <CardHeader><CardTitle>Resend Verification Email</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter your email to receive a fresh verification link or guidance for accessing your account. Email confirmation is followed by administrator approval.</p>
      <ForgotPasswordForm verification />
    </CardContent>
  </Card>;
}
