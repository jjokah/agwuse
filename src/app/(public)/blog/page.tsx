import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read the latest articles, news, and updates from AG Wuse Church.",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true, type: { in: ["BLOG", "NEWS"] } },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { firstName: true, lastName: true } } },
    take: 20,
  });

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Blog &amp; News</h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with the latest articles, news, and insights from our
            church community.
          </p>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="No posts yet"
            description="Check back soon for articles and news updates."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-lg border bg-card p-6 transition-colors hover:border-brand-gold"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{post.type === "NEWS" ? "News" : "Blog"}</span>
                  {post.publishedAt && (
                    <>
                      <span>&middot;</span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </>
                  )}
                </div>
                <h2 className="mb-2 text-lg font-semibold group-hover:text-brand-gold-dark">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                {post.author && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    By {post.author.firstName} {post.author.lastName}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
