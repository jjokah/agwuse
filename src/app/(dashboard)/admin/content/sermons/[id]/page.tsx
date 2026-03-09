import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SermonForm } from "../sermon-form";
import { DeleteSermonButton } from "./delete-sermon-button";

export const metadata: Metadata = { title: "Edit Sermon" };

export default async function EditSermonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;

  const sermon = await prisma.sermon.findUnique({ where: { id } });
  if (!sermon) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/content/sermons"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Sermons
        </Link>
        <DeleteSermonButton sermonId={sermon.id} />
      </div>
      <Card>
        <CardHeader><CardTitle>Edit Sermon</CardTitle></CardHeader>
        <CardContent><SermonForm sermon={sermon} /></CardContent>
      </Card>
    </div>
  );
}
