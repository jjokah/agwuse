import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlogPostForm } from "../blog-post-form";

export const metadata: Metadata = {
  title: "New Post",
};

export default async function NewBlogPostPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/content/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Posts
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <CardContent>
          <BlogPostForm />
        </CardContent>
      </Card>
    </div>
  );
}
