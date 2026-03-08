import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Live Stream",
  description: `Watch ${CHURCH_INFO.shortName} services live online.`,
};

export default function LivePage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Live Stream</h1>
          <p className="text-lg text-muted-foreground">
            Join our services from anywhere. Watch live or catch up on recent
            broadcasts.
          </p>
        </div>

        {/* Live Player Placeholder */}
        <div className="mb-8 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed bg-muted">
          <div className="text-center">
            <Radio className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No Live Stream</h2>
            <p className="text-sm text-muted-foreground">
              The live stream will be available during service times.
            </p>
          </div>
        </div>

        {/* Service Times Reminder */}
        <div className="rounded-lg bg-muted p-6 text-center">
          <h3 className="mb-2 font-semibold">Service Times</h3>
          <p className="text-muted-foreground">
            <strong>Sunday Service / Sunday School:</strong> 8:00 AM
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The live stream typically begins a few minutes before the service
            starts.
          </p>
        </div>
      </div>
    </div>
  );
}
