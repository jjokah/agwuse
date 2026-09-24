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
import { createTransaction, getMemberActivePledges } from "@/lib/actions/finance-actions";
import { MemberCombobox } from "@/components/shared/member-combobox";
import type { MemberSearchResult } from "@/lib/actions/member-search-actions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { toLagosDateString } from "@/lib/tz";

export interface TransactionFormProps {
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

interface ActivePledge {
  id: string;
  title: string;
  remaining: number;
}

export function TransactionForm({
  categories,
  redirectTo = "/admin/finance/transactions",
}: TransactionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [txType, setTxType] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberPledges, setMemberPledges] = useState<ActivePledge[]>([]);
  const [pledgeId, setPledgeId] = useState<string>("none");

  const isExpense = txType === "EXPENSE";
  const isOffering = txType === "OFFERING";
  const isPledgePayment = txType === "PLEDGE_PAYMENT";

  async function handleMemberChange(member: MemberSearchResult | null) {
    const id = member ? member.id : "";
    setSelectedMemberId(id);
    setPledgeId("none");
    if (!id) {
      setMemberPledges([]);
      return;
    }
    try {
      const pledges = await getMemberActivePledges(id);
      setMemberPledges(pledges);
      if (pledges.length > 0 && isPledgePayment) {
        setPledgeId(pledges[0].id);
      }
    } catch {
      setMemberPledges([]);
    }
  }

  async function handleSubmit(formData: FormData) {
    if (isPledgePayment && (!selectedMemberId || pledgeId === "none")) {
      toast.error("Please select both a church member and their pledge for a pledge payment.");
      return;
    }

    setLoading(true);
    if (selectedMemberId) {
      formData.set("memberId", selectedMemberId);
    }
    if (pledgeId && pledgeId !== "none") {
      formData.set("pledgeId", pledgeId);
    }

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
          <Label htmlFor="type">Transaction Type *</Label>
          <Select
            name="type"
            required
            onValueChange={(v) => {
              if (typeof v === "string") {
                setTxType(v);
                if (v === "PLEDGE_PAYMENT" && memberPledges.length > 0 && pledgeId === "none") {
                  setPledgeId(memberPledges[0].id);
                }
              }
            }}
          >
            <SelectTrigger id="type">
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
          <Label htmlFor="amount">Amount (NGN) *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <Select name="paymentMethod" required defaultValue="CASH">
            <SelectTrigger id="paymentMethod">
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
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={toLagosDateString()}
          />
        </div>
      </div>

      {/* Member combobox (for income types) */}
      {!isExpense && (
        <div className="space-y-2">
          <Label htmlFor="memberId">
            Member {isPledgePayment ? "*" : "(optional)"}
          </Label>
          <MemberCombobox
            name="memberId"
            onSelect={handleMemberChange}
            placeholder="Search member by name, email, or phone..."
          />
        </div>
      )}

      {/* Pledge Link */}
      {!isExpense && selectedMemberId && (memberPledges.length > 0 || isPledgePayment) && (
        <div className="space-y-2">
          <Label htmlFor="pledgeId">
            Link to Active Pledge {isPledgePayment ? "*" : "(optional)"}
          </Label>
          <Select value={pledgeId} onValueChange={(val) => setPledgeId(val || "none")}>
            <SelectTrigger id="pledgeId">
              <SelectValue placeholder="Select pledge to credit" />
            </SelectTrigger>
            <SelectContent>
              {!isPledgePayment && <SelectItem value="none">No Pledge Linked</SelectItem>}
              {memberPledges.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title} (Remaining: {formatCurrency(p.remaining)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPledgePayment && memberPledges.length === 0 && (
            <p className="text-xs text-destructive">
              This member has no active pledges. Create a pledge first or choose a different type.
            </p>
          )}
        </div>
      )}

      {/* Offering Category */}
      {isOffering && (
        <div className="space-y-2">
          <Label htmlFor="offeringCategory">Offering Category</Label>
          <Select name="offeringCategory" defaultValue="GENERAL">
            <SelectTrigger id="offeringCategory">
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
            <SelectTrigger id="categoryId">
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
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Additional details..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Recording..." : "Record Transaction"}
      </Button>
    </form>
  );
}
