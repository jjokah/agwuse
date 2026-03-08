"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { approveUser, deactivateUser, changeUserRole } from "@/lib/actions/admin-actions";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/constants";

interface UserActionsProps {
  userId: string;
  currentRole: string;
  currentStatus: string;
}

const ROLES = ["VISITOR", "MEMBER", "DEPT_LEAD", "FINANCE", "ADMIN", "SUPER_ADMIN"] as const;

export function UserActions({ userId, currentRole, currentStatus }: UserActionsProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<"approve" | "deactivate" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveUser(userId);
    if (result.success) {
      toast.success("User approved successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to approve user");
    }
    setLoading(false);
    setConfirmAction(null);
  }

  async function handleDeactivate() {
    setLoading(true);
    const result = await deactivateUser(userId);
    if (result.success) {
      toast.success("User deactivated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to deactivate user");
    }
    setLoading(false);
    setConfirmAction(null);
  }

  async function handleRoleChange(newRole: string) {
    setLoading(true);
    const result = await changeUserRole(
      userId,
      newRole as (typeof ROLES)[number]
    );
    if (result.success) {
      toast.success(`Role changed to ${ROLE_LABELS[newRole as keyof typeof ROLE_LABELS]}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to change role");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Role Selector */}
      <Select
        defaultValue={currentRole}
        onValueChange={(val) => val && handleRoleChange(val)}
        disabled={loading}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Actions */}
      {currentStatus === "PENDING" && (
        <Button
          onClick={() => setConfirmAction("approve")}
          disabled={loading}
          size="sm"
        >
          Approve
        </Button>
      )}
      {currentStatus !== "INACTIVE" && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmAction("deactivate")}
          disabled={loading}
        >
          Deactivate
        </Button>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmAction === "approve"}
        onOpenChange={() => setConfirmAction(null)}
        title="Approve User"
        description="This will activate the user's account, allowing them to log in and access member features."
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />
      <ConfirmDialog
        open={confirmAction === "deactivate"}
        onOpenChange={() => setConfirmAction(null)}
        title="Deactivate User"
        description="This will prevent the user from logging in. They can be reactivated later."
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
