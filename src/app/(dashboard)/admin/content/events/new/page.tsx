import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "../event-form";

export const metadata: Metadata = {
  title: "New Event",
};

export default async function NewEventPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/content/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Events
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>
    </div>
  );
}
