import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmail } from "@/lib/actions/auth-actions";

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

  const result = await verifyEmail(token);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {result.success ? "Email Verified!" : "Verification Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {result.success ? (
          <>
            <p className="mb-4 text-muted-foreground">
              Your email has been verified. You can now sign in to your account.
            </p>
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Link>
          </>
        ) : (
          <>
            <p className="mb-4 text-destructive">{result.error}</p>
            <Link
              href="/register"
              className="text-sm text-primary hover:underline"
            >
              Register again
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
