"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSermon, updateSermon } from "@/lib/actions/content-actions";
import { toast } from "sonner";

interface SermonFormProps {
  sermon?: {
    id: string;
    title: string;
    speaker: string;
    description: string | null;
    date: Date;
    audioUrl: string | null;
    videoUrl: string | null;
    seriesName: string | null;
  };
}

export function SermonForm({ sermon }: SermonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = sermon
        ? await updateSermon(sermon.id, formData)
        : await createSermon(formData);
      if (result.success) {
        toast.success(sermon ? "Sermon updated" : "Sermon added");
        router.push("/admin/content/sermons");
      } else {
        toast.error(result.error || "Failed to save sermon");
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
        <Input id="title" name="title" required defaultValue={sermon?.title || ""} placeholder="Sermon title" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="speaker">Speaker</Label>
          <Input id="speaker" name="speaker" required defaultValue={sermon?.speaker || ""} placeholder="Speaker name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={sermon ? new Date(sermon.date).toISOString().split("T")[0] : ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seriesName">Series Name (optional)</Label>
        <Input id="seriesName" name="seriesName" defaultValue={sermon?.seriesName || ""} placeholder="e.g. Faith Series" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={sermon?.description || ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="audioUrl">Audio URL (optional)</Label>
          <Input id="audioUrl" name="audioUrl" defaultValue={sermon?.audioUrl || ""} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="videoUrl">Video URL (optional)</Label>
          <Input id="videoUrl" name="videoUrl" defaultValue={sermon?.videoUrl || ""} placeholder="https://youtube.com/..." />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : sermon ? "Update Sermon" : "Add Sermon"}
      </Button>
    </form>
  );
}
