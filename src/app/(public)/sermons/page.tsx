import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { Headphones } from "lucide-react";
import { PageHero } from "@/components/public/page-hero";
import { SermonCard } from "@/components/public/sermon-card";

import { withBuildFallback } from "@/lib/build-fallback";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sermons",
  description: "Listen to and watch sermons from AG Wuse Church.",
};

async function getSermons() {
  return withBuildFallback(
    () =>
      prisma.sermon.findMany({
        orderBy: { date: "desc" },
        take: 30,
      }),
    [],
  );
}

export default async function SermonsPage() {
  const sermons = await getSermons();

  return (
    <>
      <PageHero
        eyebrow="The Word"
        title="Sermons"
        description="Catch up on past messages. Listen to audio sermons or watch on video."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          {sermons.length === 0 ? (
            <EmptyState
              icon={<Headphones />}
              title="No sermons yet"
              description="Sermons will be uploaded here soon. Check back later."
            />
          ) : (
            <div className="space-y-6">
              {sermons.map((sermon) => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
