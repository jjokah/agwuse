"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/actions/user-actions";
import { signOutAction } from "@/lib/actions/session-actions";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    let changed = false;
    try {
      const result = await changePassword(formData);
      if (result.success) {
        changed = true;
        toast.success("Password changed. Please sign in with your new password.");
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }

    // All sessions were revoked server-side; clear this one and go to the login page.
    // (Outside the try so the framework's redirect isn't reported as an error.)
    if (changed) {
      await signOutAction();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters with uppercase, lowercase, and a number
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Changing..." : "Change Password"}
      </Button>
    </form>
  );
}
