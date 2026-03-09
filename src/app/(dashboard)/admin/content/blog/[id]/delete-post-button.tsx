"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteBlogPost } from "@/lib/actions/content-actions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteBlogPost(postId);
      toast.success("Post deleted");
      router.push("/admin/content/blog");
    } catch {
      toast.error("Failed to delete post");
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="mr-1 size-4" />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
