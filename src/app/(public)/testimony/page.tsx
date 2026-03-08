import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmissionForm } from "@/components/forms/submission-form";
import { submitTestimony } from "@/lib/actions/submission-actions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Share Testimony",
  description: "Share your testimony of what God has done in your life.",
};

export default async function TestimonyPage() {
  // Fetch approved public testimonies
  const testimonies = await prisma.submission.findMany({
    where: { type: "TESTIMONY", status: "APPROVED", isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">Share Your Testimony</h1>
          <p className="text-lg text-muted-foreground">
            Tell us what God has done for you. Your testimony could encourage
            someone else!
          </p>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Your Testimony</CardTitle>
            <CardDescription>
              Share your testimony and choose whether to make it public for
              others to read.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionForm type="testimony" onSubmit={submitTestimony} />
          </CardContent>
        </Card>

        {/* Public Testimonies */}
        {testimonies.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">Testimonies</h2>
            <div className="space-y-4">
              {testimonies.map((t) => (
                <div key={t.id} className="rounded-lg border bg-card p-6">
                  <p className="mb-3 text-muted-foreground">{t.content}</p>
                  <p className="text-sm font-medium">— {t.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
