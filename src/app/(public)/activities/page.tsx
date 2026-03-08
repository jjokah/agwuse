import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { WEEKLY_ACTIVITIES, CHURCH_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Weekly Activities",
  description: `Weekly programs and activities at ${CHURCH_INFO.name}.`,
};

export default function ActivitiesPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Weekly Activities</h1>
          <p className="text-lg text-muted-foreground">
            Join us throughout the week for worship, study, and fellowship.
          </p>
        </div>

        <div className="space-y-4">
          {WEEKLY_ACTIVITIES.map((activity) => (
            <div
              key={activity.day}
              className="flex items-center gap-4 rounded-lg border bg-card p-6"
            >
              <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-gold/10">
                <span className="text-xs font-bold text-brand-gold-dark">
                  {activity.day.slice(0, 3).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{activity.activity}</h3>
                <p className="text-sm text-muted-foreground">
                  Every {activity.day}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="size-4" />
                {activity.time}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg bg-muted p-6 text-center">
          <p className="text-muted-foreground">
            All activities hold at the church premises:{" "}
            <span className="font-medium text-foreground">
              {CHURCH_INFO.address}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
