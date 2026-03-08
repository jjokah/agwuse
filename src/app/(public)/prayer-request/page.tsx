import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmissionForm } from "@/components/forms/submission-form";
import { submitPrayerRequest } from "@/lib/actions/submission-actions";

export const metadata: Metadata = {
  title: "Prayer Request",
  description: "Submit your prayer request. Our prayer team is ready to stand with you in prayer.",
};

export default function PrayerRequestPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">Prayer Request</h1>
          <p className="text-lg text-muted-foreground">
            &quot;The prayer of a righteous person is powerful and
            effective.&quot; — James 5:16
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Share Your Prayer Need</CardTitle>
            <CardDescription>
              Your prayer request will be shared with our prayer team. You can
              choose whether to make it public.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionForm
              type="prayer-request"
              onSubmit={submitPrayerRequest}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
