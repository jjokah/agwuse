"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { voidTransactionAction } from "@/lib/actions/transaction-actions";
import { toast } from "sonner";
import { Ban } from "lucide-react";

interface VoidTransactionDialogProps {
  transactionId: string;
  receiptNumber?: string | null;
  amount: string;
}

export function VoidTransactionDialog({
  transactionId,
  receiptNumber,
  amount,
}: VoidTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVoid(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for voiding this transaction.");
      return;
    }

    setLoading(true);
    try {
      const result = await voidTransactionAction(transactionId, reason);
      if (result.success) {
        toast.success("Transaction voided successfully.");
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to void transaction.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Ban className="mr-1 size-3.5" />
        Void
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleVoid}>
            <DialogHeader>
              <DialogTitle className="text-destructive">Void Transaction</DialogTitle>
              <DialogDescription>
                This will permanently void receipt {receiptNumber || transactionId} ({amount}).
                The receipt number will remain reserved in the ledger for audit integrity.
                Any linked pledge payment will be automatically reversed.
              </DialogDescription>
            </DialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="voidReason">Reason for Voiding *</Label>
            <Textarea
              id="voidReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Duplicate entry, incorrect donor assigned, charge reversed"
              rows={3}
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !reason.trim()}
            >
              {loading ? "Voiding..." : "Confirm Void"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
