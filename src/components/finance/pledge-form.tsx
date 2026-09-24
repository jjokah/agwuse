"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberCombobox } from "@/components/shared/member-combobox";
import { createPledge } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { toLagosDateString } from "@/lib/tz";

interface PledgeFormProps {
  redirectPath?: string;
}

export function PledgeForm({ redirectPath = "/admin/finance/pledges" }: PledgeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!memberId) {
      toast.error("Please select a church member for this pledge.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("memberId", memberId);

    try {
      const result = await createPledge(formData);
      if (result.success) {
        toast.success("Pledge recorded successfully");
        router.push(redirectPath);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create pledge");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const todayStr = toLagosDateString();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Pledge Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., 2026 Building Fund Project"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Church Member *</Label>
        <MemberCombobox
          name="memberId"
          onSelect={(member) => setMemberId(member ? member.id : "")}
          placeholder="Search member by name, email, or phone..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Target Amount (NGN) *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="1"
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={todayStr}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Target Due Date (optional)</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !memberId}>
          {loading ? "Recording..." : "Record Pledge"}
        </Button>
      </div>
    </form>
  );
}
