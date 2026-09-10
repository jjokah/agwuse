import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";
import { PageHero } from "@/components/public/page-hero";
import { BlogCard } from "@/components/public/blog-card";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description: "Read the latest articles, news, and updates from AG Wuse Church.",
};

async function getBlogPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true, type: { in: ["BLOG", "NEWS"] } },
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { firstName: true, lastName: true } } },
      take: 20,
    });
  } catch (err) {
    console.error("Failed to load blog posts:", err);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="Stories & Updates"
        title="Blog & News"
        description="Stay updated with the latest articles, news, and insights from our church community."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          {posts.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="No posts yet"
              description="Check back soon for articles and news updates."
            />
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              {featured && <BlogCard post={featured} featured />}
              {rest.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
