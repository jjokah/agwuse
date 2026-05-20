import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Stream",
  description: `Watch ${CHURCH_INFO.shortName} services live online.`,
};

const ALLOWED_EMBED_PREFIXES = [
  "https://www.youtube.com/embed/",
  "https://youtube.com/embed/",
  "https://www.youtube-nocookie.com/embed/",
  "https://www.facebook.com/plugins/video.php",
];

function isAllowedEmbedUrl(url: string): boolean {
  return ALLOWED_EMBED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export default async function LivePage() {
  const config = await prisma.liveStreamConfig.findUnique({
    where: { id: "default" },
  });

  const isLive = config?.isLive ?? false;
  const youtubeUrl =
    config?.youtubeUrl && isAllowedEmbedUrl(config.youtubeUrl)
      ? config.youtubeUrl
      : null;
  const facebookUrl =
    config?.facebookUrl && isAllowedEmbedUrl(config.facebookUrl)
      ? config.facebookUrl
      : null;
  const hasStream = isLive && (youtubeUrl || facebookUrl);

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            {config?.title || "Live Stream"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {config?.description ||
              "Join our services from anywhere. Watch live or catch up on recent broadcasts."}
          </p>
        </div>

        {hasStream ? (
          <div className="mb-8 space-y-6">
            {youtubeUrl && (
              <iframe
                className="aspect-video w-full rounded-lg"
                src={youtubeUrl}
                title="YouTube Live Stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            {facebookUrl && (
              <iframe
                className="aspect-video w-full rounded-lg"
                src={facebookUrl}
                title="Facebook Live Stream"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          <div className="mb-8 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed bg-muted">
            <div className="text-center">
              <Radio className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No Live Stream</h2>
              <p className="text-sm text-muted-foreground">
                The live stream will be available during service times.
              </p>
            </div>
          </div>
        )}

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
