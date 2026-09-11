import type { Metadata } from "next";
import Link from "next/link";
import { recordPaystackPayment } from "@/lib/finance/paystack";

export const metadata: Metadata = {
  title: "Giving Complete",
  description: "Payment confirmation for your online gift to AG Wuse Church.",
};

interface GiveCompletePageProps {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}

export default async function GiveCompletePage({ searchParams }: GiveCompletePageProps) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;

  if (!reference) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-destructive">Missing Reference</h1>
        <p className="mt-2 text-muted-foreground">
          No payment reference was provided in the callback.
        </p>
        <Link
          href="/give"
          className="mt-6 inline-block rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-light"
        >
          Return to Giving
        </Link>
      </div>
    );
  }

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  let receiptNumber: string | null = null;
  let isSuccess = false;
  let errorMessage: string | null = null;

  if (!paystackSecretKey) {
    errorMessage = "Payment service is currently unavailable. If debited, please contact the church office.";
  } else {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${paystackSecretKey}` },
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (result.status && result.data?.status === "success") {
        const data = result.data;
        const amountInNaira = Math.round(Number(data.amount)) / 100;

        const recordResult = await recordPaystackPayment({
          reference: data.reference,
          amount: amountInNaira,
          currency: data.currency || "NGN",
          paid_at: data.paid_at,
          customer: data.customer,
          metadata: data.metadata,
        });

        if (recordResult.status === "mismatch") {
          errorMessage = "Payment details do not match the initialized record.";
        } else if (recordResult.status === "ignored") {
          errorMessage = recordResult.message;
        } else {
          isSuccess = true;
          receiptNumber = recordResult.receiptNumber || null;
        }
      } else {
        errorMessage = result.message || "Payment verification failed or transaction was not successful.";
      }
    } catch (err) {
      console.error("Payment complete verification error:", err);
      errorMessage = "Could not verify payment status. If debited, please contact the church office.";
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      {isSuccess ? (
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink">Thank You for Your Gift!</h1>
          <p className="mt-2 text-ink-soft">
            Your transaction has been verified and recorded. May the Lord bless and multiply your seed!
          </p>
          {receiptNumber && (
            <p className="mt-4 text-sm font-semibold text-brand-navy">
              Receipt: <span className="font-mono">{receiptNumber}</span>
            </p>
          )}
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/give"
              className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-medium text-ink hover:border-gold-deep hover:text-gold-deep"
            >
              Give Again
            </Link>
            <Link
              href="/"
              className="rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-light"
            >
              Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-destructive/20 bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-destructive">Payment Incomplete</h1>
          <p className="mt-2 text-ink-soft">{errorMessage}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/give"
              className="rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-light"
            >
              Try Again
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-medium text-ink hover:border-gold-deep hover:text-gold-deep"
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
