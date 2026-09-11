import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getChurchInfo } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Users, ScrollText } from "lucide-react";
import { ChurchSettingsForm } from "./church-settings-form";

export const metadata: Metadata = {
  title: "Admin Settings",
};

export default async function AdminSettingsPage() {
  await requireRole(["SUPER_ADMIN"]);
  const churchInfo = await getChurchInfo();

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
        <div className="rounded-lg border bg-card p-6 border-brand-gold/50 bg-brand-gold/5">
          <Settings className="mb-2 size-6 text-brand-gold-dark" />
          <h3 className="font-semibold">General</h3>
          <p className="text-sm text-muted-foreground">Church information &amp; bank details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Church Configuration</CardTitle>
          <CardDescription>
            Authoritative source of truth for public branding, giving accounts, contact details, and notification alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChurchSettingsForm initialData={churchInfo} />
        </CardContent>
      </Card>
    </div>
  );
}
