import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { MediaImage } from "@/components/public/media-image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
  });

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: post.featuredImage ? { images: [post.featuredImage] } : undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { author: { select: { firstName: true, lastName: true } } },
  });

  if (!post) notFound();

  return (
    <div className="px-4 py-16 sm:py-20">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="mb-10 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-gold-deep"
        >
          <ArrowLeft className="size-4" />
          Back to Blog
        </Link>

        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
            {post.type === "NEWS" ? "News" : "Blog"}
            {post.publishedAt && (
              <span className="ml-3 font-normal normal-case tracking-normal text-ink-soft">
                {formatDate(post.publishedAt)}
              </span>
            )}
          </p>
          <h1 className="font-display mt-3 text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            {post.title}
          </h1>
          {post.author && (
            <p className="mt-4 text-sm text-ink-soft">
              By {post.author.firstName} {post.author.lastName}
            </p>
          )}
        </header>

        {post.featuredImage && (
          <MediaImage
            src={post.featuredImage}
            alt={post.title}
            aspect="video"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="mb-12 rounded-3xl shadow-warm"
          />
        )}

        <div
          className="prose prose-lg mx-auto max-w-2xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      </article>
    </div>
  );
}
