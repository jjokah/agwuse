"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface SubmissionFormProps {
  type: "prayer-request" | "testimony";
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function SubmissionForm({ type, onSubmit }: SubmissionFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const label = type === "prayer-request" ? "Prayer Request" : "Testimony";

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    try {
      formData.set("isPublic", String(isPublic));
      const result = await onSubmit(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Submission failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 px-4 py-6 text-center text-green-800 dark:bg-green-900/20 dark:text-green-400">
        <h3 className="mb-2 text-lg font-semibold">Thank You!</h3>
        <p className="text-sm">
          Your {label.toLowerCase()} has been submitted
          {type === "prayer-request"
            ? ". Our prayer team will be praying with you."
            : " and will be reviewed for sharing with the church."}
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">
          {type === "prayer-request" ? "Your Prayer Request" : "Your Testimony"}
        </Label>
        <Textarea
          id="content"
          name="content"
          required
          rows={6}
          placeholder={
            type === "prayer-request"
              ? "Share your prayer need..."
              : "Share what God has done for you..."
          }
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(checked === true)}
        />
        <Label htmlFor="isPublic" className="text-sm font-normal">
          Allow this to be shared publicly (after approval)
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : `Submit ${label}`}
      </Button>
    </form>
  );
}
