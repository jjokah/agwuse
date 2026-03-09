"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction } from "@/lib/actions/finance-actions";
import { toast } from "sonner";

interface TransactionFormProps {
  members: { id: string; firstName: string; lastName: string }[];
  categories: { id: string; name: string; type: string }[];
  redirectTo?: string;
}

const TYPES = [
  { value: "TITHE", label: "Tithe" },
  { value: "OFFERING", label: "Offering" },
  { value: "DONATION", label: "Donation" },
  { value: "PLEDGE_PAYMENT", label: "Pledge Payment" },
  { value: "EXPENSE", label: "Expense" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "POS", label: "POS" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "ONLINE", label: "Online (Paystack)" },
];

const OFFERING_CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "SPECIAL", label: "Special" },
  { value: "MISSION", label: "Mission" },
  { value: "BUILDING_FUND", label: "Building Fund" },
  { value: "WELFARE", label: "Welfare" },
  { value: "THANKSGIVING", label: "Thanksgiving" },
  { value: "HARVEST", label: "Harvest" },
  { value: "FIRST_FRUIT", label: "First Fruit" },
  { value: "OTHER", label: "Other" },
];

export function TransactionForm({ members, categories, redirectTo = "/admin/finance/transactions" }: TransactionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [txType, setTxType] = useState("");

  const isExpense = txType === "EXPENSE";
  const isOffering = txType === "OFFERING";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await createTransaction(formData);
      if (result.success) {
        toast.success(`Transaction recorded. Receipt: ${result.receiptNumber}`);
        router.push(redirectTo);
      } else {
        toast.error(result.error || "Failed to record transaction");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Transaction Type</Label>
          <Select name="type" required onValueChange={(v) => { if (typeof v === "string") setTxType(v); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
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
          <Label htmlFor="amount">Amount (NGN)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select name="paymentMethod" required>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      {/* Member (for income types) */}
      {!isExpense && (
        <div className="space-y-2">
          <Label htmlFor="memberId">Member (optional)</Label>
          <Select name="memberId">
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Offering Category */}
      {isOffering && (
        <div className="space-y-2">
          <Label htmlFor="offeringCategory">Offering Category</Label>
          <Select name="offeringCategory">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {OFFERING_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Expense Category */}
      {isExpense && (
        <div className="space-y-2">
          <Label htmlFor="categoryId">Expense Category</Label>
          <Select name="categoryId">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((c) => c.type === "EXPENSE")
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="referenceNumber">Reference Number (optional)</Label>
        <Input
          id="referenceNumber"
          name="referenceNumber"
          placeholder="Bank ref, transfer ID, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Additional details..." />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Recording..." : "Record Transaction"}
      </Button>
    </form>
  );
}
