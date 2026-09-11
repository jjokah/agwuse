import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyEmailButton } from "./verify-email-button";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invalid Link</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            This verification link is invalid. Please check your email for the
            correct link.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Go to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4 text-muted-foreground">
          Click the button below to confirm your email address.
        </p>
        <VerifyEmailButton token={token} />
      </CardContent>
    </Card>
  );
}
