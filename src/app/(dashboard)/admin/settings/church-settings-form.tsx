"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateChurchSettingsAction } from "@/lib/actions/settings-actions";
import { toast } from "sonner";
import type { ChurchInfo } from "@/lib/settings/schema";

interface ChurchSettingsFormProps {
  initialData: ChurchInfo;
}

export function ChurchSettingsForm({ initialData }: ChurchSettingsFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateChurchSettingsAction(formData);
      if (result.success) {
        toast.success("Church settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("An unexpected error occurred while saving settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Church Identity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="church_name">Full Legal Name</Label>
            <Input
              id="church_name"
              name="church_name"
              defaultValue={initialData.church_name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="church_short_name">Short Name / Brand</Label>
            <Input
              id="church_short_name"
              name="church_short_name"
              defaultValue={initialData.church_short_name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="church_tagline">Motto / Tagline</Label>
            <Input
              id="church_tagline"
              name="church_tagline"
              defaultValue={initialData.church_tagline}
              required
            />
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Contact & Location */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Contact & Location</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="church_address">Physical Address</Label>
            <Input
              id="church_address"
              name="church_address"
              defaultValue={initialData.church_address}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="church_email">Official Email</Label>
              <Input
                id="church_email"
                name="church_email"
                type="email"
                defaultValue={initialData.church_email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="church_phones">
                Phone Numbers <span className="text-xs text-muted-foreground">(one per line or comma-separated)</span>
              </Label>
              <Textarea
                id="church_phones"
                name="church_phones"
                rows={2}
                defaultValue={initialData.church_phones.join("\n")}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Banking Details */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Official Bank Account (Giving)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              name="bank_name"
              defaultValue={initialData.bank_name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account">Account Number</Label>
            <Input
              id="bank_account"
              name="bank_account"
              defaultValue={initialData.bank_account}
              required
            />
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Schedules and Admin Alerts */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Schedules & Notifications</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="service_times">
              Service Times <span className="text-xs text-muted-foreground">(one per line)</span>
            </Label>
            <Textarea
              id="service_times"
              name="service_times"
              rows={4}
              defaultValue={initialData.service_times.join("\n")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notification_emails">
              Admin Alert Emails <span className="text-xs text-muted-foreground">(new registrations &amp; prayer requests)</span>
            </Label>
            <Textarea
              id="notification_emails"
              name="notification_emails"
              rows={4}
              defaultValue={initialData.notification_emails.join("\n")}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} className="min-w-[140px]">
          {loading ? "Saving Settings..." : "Save All Settings"}
        </Button>
      </div>
    </form>
  );
}
