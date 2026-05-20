"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLiveStreamConfig } from "@/lib/actions/content-actions";
import { toast } from "sonner";

interface LiveStreamFormProps {
  config: {
    youtubeUrl: string | null;
    facebookUrl: string | null;
    isLive: boolean;
    title: string | null;
    description: string | null;
  } | null;
}

export function LiveStreamForm({ config }: LiveStreamFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await updateLiveStreamConfig(formData);
      if (result.success) {
        toast.success("Live stream settings updated");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isLive"
          name="isLive"
          defaultChecked={config?.isLive ?? false}
          className="size-4 rounded border-input"
        />
        <Label htmlFor="isLive" className="text-base font-semibold">
          Currently Live
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Stream Title (optional)</Label>
        <Input
          id="title"
          name="title"
          defaultValue={config?.title || ""}
          placeholder="e.g. Sunday Service - Live"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={config?.description || ""}
          placeholder="Brief description of the live stream"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="youtubeUrl">YouTube Embed URL</Label>
        <Input
          id="youtubeUrl"
          name="youtubeUrl"
          defaultValue={config?.youtubeUrl || ""}
          placeholder="https://www.youtube.com/embed/VIDEO_ID"
        />
        <p className="text-xs text-muted-foreground">
          Use the embed URL format: https://www.youtube.com/embed/VIDEO_ID
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="facebookUrl">Facebook Embed URL</Label>
        <Input
          id="facebookUrl"
          name="facebookUrl"
          defaultValue={config?.facebookUrl || ""}
          placeholder="https://www.facebook.com/plugins/video.php?href=..."
        />
        <p className="text-xs text-muted-foreground">
          Use the Facebook Video Plugin URL format:
          https://www.facebook.com/plugins/video.php?href=ENCODED_URL
        </p>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
