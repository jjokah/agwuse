import { ContentType } from "@prisma/client";
import { normalizeSearchParams } from "@/lib/search-params";
import type { Metadata } from "next";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { parsePageParams, resolvePage, pageMeta } from "@/lib/pagination";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { FilterSelect, FilterSubmit } from "@/components/shared/filter-select";
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
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Blog Management",
};

const TYPE_OPTIONS = [
  { value: "BLOG", label: "Blog" },
  { value: "NEWS", label: "News" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
];

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; pageSize?: string }>;
}) {
  await requirePageRole(["ADMIN", "SUPER_ADMIN"]);
  const params = normalizeSearchParams(await searchParams);
  const { type } = params;


  const where: Prisma.BlogPostWhereInput = {};
  if (type && Object.values(ContentType).includes(type as ContentType)) where.type = type as ContentType;

  const { posts, total, page, pageSize } = await prisma.$transaction(async (tx) => {
    const total = await tx.blogPost.count({ where });
    const { page, pageSize, skip, take } = resolvePage(parsePageParams(params), total);
    const posts = await tx.blogPost.findMany({
      where,
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take,
    });
    return { posts, total, page, pageSize };
  }, { isolationLevel: "RepeatableRead" });

  const meta = pageMeta({ totalItems: total, page, pageSize });

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
      <form className="flex items-center gap-3">
        <FilterSelect
          name="type"
          placeholder="All Types"
          defaultValue={type || ""}
          options={TYPE_OPTIONS}
        />
        <FilterSubmit text="Filter" />
      </form>

      {posts.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No posts yet"
          description="Create your first blog post or announcement."
        />
      ) : (
        <div className="space-y-4">
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

          <PaginationBar
            meta={meta}
            basePath="/admin/content/blog"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
