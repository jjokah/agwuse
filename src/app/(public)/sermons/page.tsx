import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Headphones, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Sermons",
  description: "Listen to and watch sermons from AG Wuse Church.",
};

export default async function SermonsPage() {
  const sermons = await prisma.sermon.findMany({
    orderBy: { date: "desc" },
    take: 30,
  });

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Sermons</h1>
          <p className="text-lg text-muted-foreground">
            Catch up on past messages. Listen to audio sermons or watch on
            video.
          </p>
        </div>

        {sermons.length === 0 ? (
          <EmptyState
            icon={<Headphones />}
            title="No sermons yet"
            description="Sermons will be uploaded here soon. Check back later."
          />
        ) : (
          <div className="space-y-4">
            {sermons.map((sermon) => (
              <div
                key={sermon.id}
                className="flex flex-col gap-4 rounded-lg border bg-card p-6 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <h2 className="font-semibold">{sermon.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{sermon.speaker}</span>
                    <span>&middot;</span>
                    <span>{formatDate(sermon.date)}</span>
                    {sermon.seriesName && (
                      <>
                        <span>&middot;</span>
                        <span className="italic">{sermon.seriesName}</span>
                      </>
                    )}
                  </div>
                  {sermon.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {sermon.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {sermon.audioUrl && (
                    <a
                      href={sermon.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Headphones className="size-4" />
                      Audio
                    </a>
                  )}
                  {sermon.videoUrl && (
                    <a
                      href={sermon.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Video className="size-4" />
                      Video
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
