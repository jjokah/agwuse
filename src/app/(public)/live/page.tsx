import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/public/page-hero";
import { ServiceTimesStrip } from "@/components/public/service-times-strip";

export const revalidate = 30;

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

async function getLiveStreamConfig() {
  try {
    return await prisma.liveStreamConfig.findUnique({
      where: { id: "default" },
    });
  } catch (err) {
    console.error("Failed to load live stream config:", err);
    return null;
  }
}

export default async function LivePage() {
  const config = await getLiveStreamConfig();

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
    <>
      <PageHero
        eyebrow="Worship From Anywhere"
        title={config?.title || "Live Stream"}
        description={
          config?.description ||
          "Join our services from anywhere. Watch live or catch up on recent broadcasts."
        }
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          {hasStream ? (
            <div className="mb-14 space-y-6">
              {youtubeUrl && (
                <iframe
                  className="aspect-video w-full rounded-3xl shadow-warm"
                  src={youtubeUrl}
                  title="YouTube Live Stream"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {facebookUrl && (
                <iframe
                  className="aspect-video w-full rounded-3xl shadow-warm"
                  src={facebookUrl}
                  title="Facebook Live Stream"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          ) : (
            <div className="mb-14 flex aspect-video w-full flex-col items-center justify-center rounded-3xl bg-brand-navy px-6 text-center shadow-warm">
              <span className="flex items-center gap-2.5 rounded-full border border-white/15 px-4 py-1.5">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-brand-gold" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">
                  Currently Offline
                </span>
              </span>
              <h2 className="font-display mt-6 text-2xl font-medium tracking-tight text-white sm:text-3xl">
                We will see you at the next service
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                The live stream typically begins a few minutes before the
                service starts. In the meantime, catch up on past messages.
              </p>
              <Link
                href="/sermons"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-brand-gold px-7 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
              >
                Browse Sermons
                <ArrowRight className="size-4" />
              </Link>
            </div>
          )}

          <ServiceTimesStrip variant="inline" />
        </div>
      </div>
    </>
  );
}
