"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cancelPledge } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { Ban } from "lucide-react";

interface CancelPledgeButtonProps {
  pledgeId: string;
  title: string;
}

export function CancelPledgeButton({ pledgeId, title }: CancelPledgeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const result = await cancelPledge(pledgeId);
      if (result.success) {
        toast.success("Pledge cancelled");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to cancel pledge");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Ban className="mr-1.5 size-3.5" />
        Cancel Pledge
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancel Pledge"
        description={`Are you sure you want to cancel the pledge "${title}"? This cannot be undone.`}
        confirmLabel={loading ? "Cancelling..." : "Confirm Cancellation"}
        variant="destructive"
        onConfirm={handleCancel}
      />
    </>
  );
}
