"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveSubmission, archiveSubmission } from "@/lib/actions/content-actions";
import { toast } from "sonner";
import { Check, Archive } from "lucide-react";

interface ModerationActionsProps {
  id: string;
  status: string;
}

export function ModerationActions({ id, status }: ModerationActionsProps) {
  const router = useRouter();

  async function handleApprove() {
    try {
      await approveSubmission(id);
      toast.success("Submission approved");
      router.refresh();
    } catch {
      toast.error("Failed to approve");
    }
  }

  async function handleArchive() {
    try {
      await archiveSubmission(id);
      toast.success("Submission archived");
      router.refresh();
    } catch {
      toast.error("Failed to archive");
    }
  }

  return (
    <div className="flex gap-1">
      {status === "PENDING" && (
        <Button variant="ghost" size="sm" onClick={handleApprove} title="Approve">
          <Check className="size-4 text-green-600" />
        </Button>
      )}
      {status !== "ARCHIVED" && (
        <Button variant="ghost" size="sm" onClick={handleArchive} title="Archive">
          <Archive className="size-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
