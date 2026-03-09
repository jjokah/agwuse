"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { createGalleryImage, deleteGalleryImage } from "@/lib/actions/content-actions";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";

interface GalleryManagerProps {
  images: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    caption: string | null;
    albumName: string | null;
  }[];
  albums: string[];
}

export function GalleryManager({ images, albums }: GalleryManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleUpload(formData: FormData) {
    setLoading(true);
    try {
      const result = await createGalleryImage(formData);
      if (result.success) {
        toast.success("Image added");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to add image");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteGalleryImage(deleteId);
      toast.success("Image deleted");
      setDeleteId(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete image");
    }
  }

  return (
    <>
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Image</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleUpload} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="url" className="text-xs">Image URL</Label>
              <Input id="url" name="url" required placeholder="https://..." className="w-64" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="caption" className="text-xs">Caption</Label>
              <Input id="caption" name="caption" placeholder="Optional caption" className="w-48" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="albumName" className="text-xs">Album</Label>
              <Input
                id="albumName"
                name="albumName"
                placeholder="Album name"
                list="album-suggestions"
                className="w-40"
              />
              <datalist id="album-suggestions">
                {albums.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <Button type="submit" size="sm" disabled={loading}>
              <PlusCircle className="mr-1 size-4" />
              {loading ? "Adding..." : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Image Grid */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="group relative overflow-hidden rounded-lg border">
            <div className="relative aspect-square">
              <Image
                src={image.url}
                alt={image.caption || "Gallery image"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            <div className="p-2">
              <p className="truncate text-xs font-medium">
                {image.caption || "No caption"}
              </p>
              {image.albumName && (
                <p className="text-xs text-muted-foreground">{image.albumName}</p>
              )}
            </div>
            <button
              onClick={() => setDeleteId(image.id)}
              className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Image"
        description="Are you sure you want to delete this image?"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
