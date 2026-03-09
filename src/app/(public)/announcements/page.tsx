import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { EmptyState } from "@/components/shared/empty-state";
import { Megaphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Latest announcements from AG Wuse Church.",
};

export default async function AnnouncementsPage() {
  const announcements = await prisma.blogPost.findMany({
    where: { published: true, type: "ANNOUNCEMENT" },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { firstName: true, lastName: true } } },
    take: 20,
  });

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Announcements</h1>
          <p className="text-lg text-muted-foreground">
            Important updates and announcements from the church.
          </p>
        </div>

        {announcements.length === 0 ? (
          <EmptyState
            icon={<Megaphone />}
            title="No announcements"
            description="There are no announcements at this time. Check back soon."
          />
        ) : (
          <div className="space-y-4">
            {announcements.map((post) => (
              <div
                key={post.id}
                className="rounded-lg border bg-card p-6"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {post.publishedAt && (
                    <span>{formatDate(post.publishedAt)}</span>
                  )}
                </div>
                <h2 className="mb-2 text-lg font-semibold">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-muted-foreground">{post.excerpt}</p>
                )}
                {post.content && !post.excerpt && (
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
