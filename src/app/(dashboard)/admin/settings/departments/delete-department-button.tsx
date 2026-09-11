"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteDepartment } from "@/lib/actions/content-actions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface DeleteDepartmentButtonProps {
  id: string;
  name: string;
  memberCount: number;
}

export function DeleteDepartmentButton({
  id,
  name,
  memberCount,
}: DeleteDepartmentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await deleteDepartment(id);
      if (result.success) {
        toast.success(`Department "${name}" deleted`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete department");
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
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${name}`}
      >
        <Trash2 className="size-4" />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete Department: ${name}`}
        description={`This department currently has ${memberCount} assigned member(s). Deleting it will unassign all members and permanently delete the department.`}
        confirmLabel={loading ? "Deleting..." : "Delete Department"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
