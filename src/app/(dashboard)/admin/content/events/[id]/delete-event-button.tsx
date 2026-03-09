"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteEvent } from "@/lib/actions/content-actions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteEvent(eventId);
      toast.success("Event deleted");
      router.push("/admin/content/events");
    } catch {
      toast.error("Failed to delete event");
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
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
