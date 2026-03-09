"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { createBlogPost, updateBlogPost } from "@/lib/actions/content-actions";
import { toast } from "sonner";

interface BlogPostFormProps {
  post?: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    type: string;
    featuredImage: string | null;
    published: boolean;
  };
}

export function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(post?.content || "");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("content", content);
    setLoading(true);
    try {
      const result = post
        ? await updateBlogPost(post.id, formData)
        : await createBlogPost(formData);
      if (result.success) {
        toast.success(post ? "Post updated" : "Post created");
        router.push("/admin/content/blog");
      } else {
        toast.error(result.error || "Failed to save post");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={post?.title || ""}
          placeholder="Post title"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Content Type</Label>
          <Select name="type" defaultValue={post?.type || "BLOG"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BLOG">Blog</SelectItem>
              <SelectItem value="NEWS">News</SelectItem>
              <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="featuredImage">Featured Image URL</Label>
          <Input
            id="featuredImage"
            name="featuredImage"
            defaultValue={post?.featuredImage || ""}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt (optional)</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt || ""}
          placeholder="Brief description for listings..."
        />
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          name="published"
          defaultChecked={post?.published ?? false}
          className="size-4 rounded border"
        />
        <Label htmlFor="published" className="font-normal">
          Publish immediately
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Saving..."
          : post
            ? "Update Post"
            : "Create Post"}
      </Button>
    </form>
  );
}
