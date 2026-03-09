"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateChurchSetting } from "@/lib/actions/content-actions";
import { toast } from "sonner";

interface ChurchSettingsFormProps {
  settings: { key: string; label: string; value: string }[];
}

export function ChurchSettingsForm({ settings }: ChurchSettingsFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      for (const setting of settings) {
        const value = form.get(setting.key) as string;
        if (value !== setting.value) {
          await updateChurchSetting(setting.key, value);
        }
      }
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {settings.map((s) => (
        <div key={s.key} className="space-y-1">
          <Label htmlFor={s.key}>{s.label}</Label>
          <Input id={s.key} name={s.key} defaultValue={s.value} />
        </div>
      ))}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
