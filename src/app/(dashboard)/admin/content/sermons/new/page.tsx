import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SermonForm } from "../sermon-form";

export const metadata: Metadata = { title: "Add Sermon" };

export default async function NewSermonPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/content/sermons"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Sermons
      </Link>
      <Card>
        <CardHeader><CardTitle>Add Sermon</CardTitle></CardHeader>
        <CardContent><SermonForm /></CardContent>
      </Card>
    </div>
  );
}
