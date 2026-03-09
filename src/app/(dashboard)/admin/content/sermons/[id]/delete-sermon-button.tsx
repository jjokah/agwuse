"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteSermon } from "@/lib/actions/content-actions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteSermonButton({ sermonId }: { sermonId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteSermon(sermonId);
      toast.success("Sermon deleted");
      router.push("/admin/content/sermons");
    } catch {
      toast.error("Failed to delete sermon");
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="mr-1 size-4" />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Sermon"
        description="Are you sure you want to delete this sermon?"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
