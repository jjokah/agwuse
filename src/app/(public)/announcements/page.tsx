import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { EmptyState } from "@/components/shared/empty-state";
import { Megaphone } from "lucide-react";
import { PageHero } from "@/components/public/page-hero";

import { withBuildFallback } from "@/lib/build-fallback";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Announcements",
  description: "Latest announcements from AG Wuse Church.",
};

async function getAnnouncements() {
  return withBuildFallback(
    () =>
      prisma.blogPost.findMany({
        where: { published: true, type: "ANNOUNCEMENT" },
        orderBy: { publishedAt: "desc" },
        include: { author: { select: { firstName: true, lastName: true } } },
        take: 20,
      }),
    [],
  );
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <>
      <PageHero
        eyebrow="Stay Informed"
        title="Announcements"
        description="Important updates and announcements from the church."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl">
          {announcements.length === 0 ? (
            <EmptyState
              icon={<Megaphone />}
              title="No announcements"
              description="There are no announcements at this time. Check back soon."
            />
          ) : (
            <ol className="relative space-y-10 border-l border-border pl-8">
              {announcements.map((post) => (
                <li key={post.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[38.5px] top-1.5 size-2.5 rounded-full bg-brand-gold ring-4 ring-gold-soft"
                  />
                  {post.publishedAt && (
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
                      {formatDate(post.publishedAt)}
                    </p>
                  )}
                  <h2 className="font-display mt-2 text-2xl font-medium tracking-tight text-ink">
                    {post.title}
                  </h2>
                  {post.excerpt ? (
                    <p className="mt-3 leading-relaxed text-ink-soft">
                      {post.excerpt}
                    </p>
                  ) : (
                    post.content && (
                      <div
                        className="prose prose-sm mt-3 max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(post.content),
                        }}
                      />
                    )
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
