import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PlusCircle, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog Management",
};

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { type } = await searchParams;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  const posts = await prisma.blogPost.findMany({
    where,
    include: { author: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Blog & Content</h1>
        <Link
          href="/admin/content/blog/new"
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <form className="flex gap-3">
        <select
          name="type"
          defaultValue={type || ""}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All Types</option>
          <option value="BLOG">Blog</option>
          <option value="NEWS">News</option>
          <option value="ANNOUNCEMENT">Announcement</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filter
        </button>
      </form>

      {posts.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No posts yet"
          description="Create your first blog post or announcement."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-64 truncate font-medium">
                    {post.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {post.author.firstName} {post.author.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={post.published ? "default" : "secondary"}
                    >
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(post.createdAt)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/content/blog/${post.id}`}
                      className="text-sm text-brand-gold-dark hover:underline"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
