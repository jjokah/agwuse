"use client";

import { useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import {
  PUBLIC_GIVING_TYPES,
  PUBLIC_OFFERING_CATEGORIES,
  TRANSACTION_TYPE_LABELS,
  OFFERING_CATEGORY_LABELS,
} from "@/lib/finance/labels";

declare global {
  interface Window {
    PaystackPop?: {
      new (): {
        resumeTransaction: (
          accessCode: string,
          options?: {
            onSuccess?: (transaction: { reference: string }) => void;
            onCancel?: () => void;
          },
        ) => void;
      };
      setup?: (options: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

const TYPES = PUBLIC_GIVING_TYPES.map((value) => ({
  value,
  label: TRANSACTION_TYPE_LABELS[value] || value,
}));

const CATEGORIES = PUBLIC_OFFERING_CATEGORIES.map((value) => ({
  value,
  label: OFFERING_CATEGORY_LABELS[value] || value,
}));

export function PaystackForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [type, setType] = useState("TITHE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const amount = parseFloat(form.get("amount") as string);
    const name = form.get("name") as string;
    const offeringCategory = form.get("offeringCategory") as string;

    if (!email || !amount || amount < 100) {
      toast.error("Please enter a valid email and amount (min ₦100)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount,
          type,
          offeringCategory: type === "OFFERING" ? offeringCategory : undefined,
          name,
        }),
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json() : null;

      if (!res.ok) {
        toast.error(data?.error || `Failed to initialize payment (${res.status})`);
        setLoading(false);
        return;
      }

      if (!data?.authorization_url && !data?.reference) {
        toast.error("Invalid response from payment server");
        setLoading(false);
        return;
      }

      // Try Paystack Inline v2
      if (typeof window !== "undefined" && window.PaystackPop && data.access_code) {
        try {
          const popup = new window.PaystackPop();
          popup.resumeTransaction(data.access_code, {
            onSuccess: async (tx: { reference: string }) => {
              try {
                const vRes = await fetch("/api/paystack/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reference: tx.reference }),
                });
                const vData = await vRes.json();
                if (vRes.ok && vData.success) {
                  setReceiptNumber(vData.receiptNumber || null);
                  setSuccess(true);
                  toast.success("Payment successful! Thank you for your gift.");
                } else {
                  toast.error(vData.error || "Payment verification failed");
                }
              } catch {
                toast.error("Could not verify payment. If debited, please contact church office.");
              } finally {
                setLoading(false);
              }
            },
            onCancel: () => {
              toast.info("Payment window closed");
              setLoading(false);
            },
          });
          return;
        } catch (popupErr) {
          console.warn("Paystack Inline v2 resume failed, falling back to redirect:", popupErr);
        }
      }

      // Fallback: redirect to authorization URL
      window.location.href = data.authorization_url;
    } catch {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-semibold">Thank You!</h3>
        <p className="text-muted-foreground">
          Your gift has been received and confirmed. God bless you!
        </p>
        {receiptNumber && (
          <p className="mt-3 text-sm font-medium text-brand-navy">
            Receipt: <span className="font-mono">{receiptNumber}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <Script src="https://js.paystack.co/v2/inline.js" strategy="lazyOnload" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" name="name" placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Giving Type</Label>
            <Select name="type" defaultValue="TITHE" onValueChange={(v) => { if (typeof v === "string") setType(v); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="100"
              step="1"
              required
              placeholder="0"
            />
          </div>
        </div>

        {type === "OFFERING" && (
          <div className="space-y-2">
            <Label htmlFor="offeringCategory">Offering Category</Label>
            <Select name="offeringCategory" defaultValue="GENERAL">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Processing..." : "Give Now"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Secured by Paystack. Your card details are never stored on our servers.
        </p>
      </form>
    </>
  );
}
