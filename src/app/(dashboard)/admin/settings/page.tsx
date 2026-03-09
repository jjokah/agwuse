import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, ScrollText } from "lucide-react";
import { ChurchSettingsForm } from "./church-settings-form";

export const metadata: Metadata = {
  title: "Admin Settings",
};

const DEFAULT_KEYS = [
  { key: "church_name", label: "Church Name", defaultValue: "Assemblies of God Church, Wuse Zone 5" },
  { key: "church_address", label: "Address", defaultValue: "53, Accra Street, Wuse Zone 5, Abuja, Nigeria" },
  { key: "church_phone", label: "Phone", defaultValue: "0803 591 0333" },
  { key: "church_email", label: "Email", defaultValue: "info@agwuse.org" },
  { key: "service_time", label: "Main Service Time", defaultValue: "Sundays 8:00 AM" },
];

export default async function AdminSettingsPage() {
  await requireRole(["SUPER_ADMIN"]);

  const settings = await prisma.churchSettings.findMany();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const settingsWithValues = DEFAULT_KEYS.map((k) => ({
    ...k,
    value: settingsMap[k.key] || k.defaultValue,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/settings/departments"
          className="rounded-lg border bg-card p-6 transition-colors hover:border-brand-gold"
        >
          <Users className="mb-2 size-6 text-brand-gold-dark" />
          <h3 className="font-semibold">Departments</h3>
          <p className="text-sm text-muted-foreground">Manage church departments</p>
        </Link>
        <Link
          href="/admin/settings/audit-log"
          className="rounded-lg border bg-card p-6 transition-colors hover:border-brand-gold"
        >
          <ScrollText className="mb-2 size-6 text-brand-gold-dark" />
          <h3 className="font-semibold">Audit Log</h3>
          <p className="text-sm text-muted-foreground">View system activity</p>
        </Link>
        <div className="rounded-lg border bg-card p-6">
          <Settings className="mb-2 size-6 text-brand-gold-dark" />
          <h3 className="font-semibold">General</h3>
          <p className="text-sm text-muted-foreground">Church information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Church Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ChurchSettingsForm settings={settingsWithValues} />
        </CardContent>
      </Card>
    </div>
  );
}
