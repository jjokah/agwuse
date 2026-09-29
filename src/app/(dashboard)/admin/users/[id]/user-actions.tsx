"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  approveUser,
  deactivateUser,
  reactivateUser,
  changeUserRole,
} from "@/lib/actions/admin-actions";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/constants";
import { Edit } from "lucide-react";

interface UserActionsProps {
  userId: string;
  currentRole: string;
  currentStatus: string;
  actorId?: string;
  actorRole?: string;
}

const ROLES = ["VISITOR", "MEMBER", "DEPT_LEAD", "FINANCE", "ADMIN", "SUPER_ADMIN"] as const;

export function UserActions({
  userId,
  currentRole,
  currentStatus,
  actorId,
  actorRole,
}: UserActionsProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<"approve" | "deactivate" | "reactivate" | null>(null);
  const [loading, setLoading] = useState(false);

  const isSelf = actorId === userId;
  const isTargetPrivileged = currentRole === "ADMIN" || currentRole === "SUPER_ADMIN";
  const canManage = !isSelf && (actorRole === "SUPER_ADMIN" || !isTargetPrivileged);

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

  async function handleReactivate() {
    setLoading(true);
    const result = await reactivateUser(userId);
    if (result.success) {
      toast.success("User account reactivated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to reactivate user");
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
      {/* Edit Profile button */}
      <Link
        href={`/admin/users/${userId}/edit`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Edit className="mr-1.5 size-3.5" />
        Edit
      </Link>

      {/* Role Selector */}
      {canManage && (
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
      )}

      {/* Status Actions */}
      {canManage && currentStatus === "PENDING" && (
        <Button
          onClick={() => setConfirmAction("approve")}
          disabled={loading}
          size="sm"
        >
          Approve
        </Button>
      )}

      {canManage && currentStatus === "ACTIVE" && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmAction("deactivate")}
          disabled={loading}
        >
          Deactivate
        </Button>
      )}

      {canManage && currentStatus === "INACTIVE" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmAction("reactivate")}
          disabled={loading}
        >
          Reactivate
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
      <ConfirmDialog
        open={confirmAction === "reactivate"}
        onOpenChange={() => setConfirmAction(null)}
        title="Reactivate User"
        description="This will restore the user's active status and allow them to log in again."
        confirmLabel="Reactivate"
        onConfirm={handleReactivate}
      />
    </div>
  );
}
