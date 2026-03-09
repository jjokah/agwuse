"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEvent, updateEvent } from "@/lib/actions/content-actions";
import { toast } from "sonner";

interface EventFormProps {
  event?: {
    id: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    location: string;
    type: string;
    imageUrl: string | null;
    isPublished: boolean;
  };
}

const EVENT_TYPES = [
  { value: "SERVICE", label: "Service" },
  { value: "REVIVAL", label: "Revival" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "HARVEST", label: "Harvest" },
  { value: "OTHER", label: "Other" },
];

function toDateInputValue(d: Date): string {
  return new Date(d).toISOString().slice(0, 16);
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = event
        ? await updateEvent(event.id, formData)
        : await createEvent(formData);
      if (result.success) {
        toast.success(event ? "Event updated" : "Event created");
        router.push("/admin/content/events");
      } else {
        toast.error(result.error || "Failed to save event");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={event?.title || ""}
          placeholder="Event title"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date & Time</Label>
          <Input
            id="startDate"
            name="startDate"
            type="datetime-local"
            required
            defaultValue={event ? toDateInputValue(event.startDate) : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date & Time (optional)</Label>
          <Input
            id="endDate"
            name="endDate"
            type="datetime-local"
            defaultValue={event?.endDate ? toDateInputValue(event.endDate) : ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Event Type</Label>
          <Select name="type" defaultValue={event?.type || "SERVICE"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={event?.location || "AG Wuse, 53 Accra Street, Wuse Zone 5"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={event?.description || ""}
          placeholder="Event details..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          defaultValue={event?.imageUrl || ""}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          name="isPublished"
          defaultChecked={event?.isPublished ?? false}
          className="size-4 rounded border"
        />
        <Label htmlFor="isPublished" className="font-normal">
          Publish event
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
      </Button>
    </form>
  );
}
