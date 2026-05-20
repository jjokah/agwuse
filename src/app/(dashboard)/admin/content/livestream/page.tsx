import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LiveStreamForm } from "./livestream-form";

export const metadata: Metadata = {
  title: "Live Stream Settings",
};

export default async function AdminLiveStreamPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const config = await prisma.liveStreamConfig.findUnique({
    where: { id: "default" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Stream</h1>
        <p className="text-sm text-muted-foreground">
          Configure YouTube and Facebook live stream embeds for the public live
          page.
        </p>
      </div>

      <div className="max-w-2xl rounded-lg border p-6">
        <LiveStreamForm config={config} />
      </div>
    </div>
  );
}
