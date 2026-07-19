import Link from "next/link";
import type { BlogPost } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MediaImage } from "./media-image";

type BlogPostWithAuthor = BlogPost & {
  author: { firstName: string | null; lastName: string | null } | null;
};

interface BlogCardProps {
  post: BlogPostWithAuthor;
  featured?: boolean;
}

export function BlogCard({ post, featured }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl bg-paper shadow-warm transition-all hover:-translate-y-1",
        featured && "sm:col-span-2 sm:grid sm:grid-cols-2"
      )}
    >
      <MediaImage
        src={post.featuredImage}
        alt={post.title}
        aspect="video"
        sizes={featured ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 100vw, 33vw"}
        className={cn(featured && "sm:h-full sm:aspect-auto")}
        imgClassName="transition-transform duration-500 group-hover:scale-105"
      />
      <div className={cn("flex flex-1 flex-col p-6", featured && "sm:p-10 sm:justify-center")}>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
          {post.type === "NEWS" ? "News" : "Blog"}
          {post.publishedAt && (
            <span className="ml-3 font-normal normal-case tracking-normal text-ink-soft">
              {formatDate(post.publishedAt)}
            </span>
          )}
        </p>
        <h2
          className={cn(
            "font-display mt-2 font-medium tracking-tight text-ink group-hover:text-gold-deep",
            featured ? "text-2xl sm:text-3xl" : "text-xl"
          )}
        >
          {post.title}
        </h2>
        {post.excerpt && (
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed text-ink-soft",
              featured ? "line-clamp-4" : "line-clamp-3"
            )}
          >
            {post.excerpt}
          </p>
        )}
        {post.author && (
          <p className="mt-auto pt-4 text-xs text-ink-soft">
            By {post.author.firstName} {post.author.lastName}
          </p>
        )}
      </div>
    </Link>
  );
}
