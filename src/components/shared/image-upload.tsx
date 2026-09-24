"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Loader2, Image as ImageIcon } from "lucide-react";
import { UPLOAD_POLICIES, type UploadFolder } from "@/lib/uploads/policy";

interface ImageUploadProps {
  name: string;
  defaultValue?: string | null;
  folder: UploadFolder;
  label?: string;
  aspectRatio?: "square" | "video" | "wide";
  onUploadComplete?: (url: string) => void;
  className?: string;
  /** Prepended to the uploaded filename (e.g. the user id for avatars). */
  pathPrefix?: string;
  /** Show the free-text "or enter image URL" input (default true). */
  allowUrlInput?: boolean;
}

export function ImageUpload({
  name,
  defaultValue = "",
  folder,
  label = "Upload Image",
  aspectRatio = "wide",
  onUploadComplete,
  className = "",
  pathPrefix = "",
  allowUrlInput = true,
}: ImageUploadProps) {
  const [url, setUrl] = useState<string>(defaultValue || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const policy = UPLOAD_POLICIES[folder];

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square max-w-[200px]"
      : aspectRatio === "video"
        ? "aspect-video max-w-md"
        : "aspect-[2/1] max-w-lg";

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side MIME validation
    if (!policy.allowedMimeTypes.includes(file.type)) {
      toast.error(
        `Invalid file format. Allowed types: ${policy.allowedMimeTypes
          .map((t) => t.replace("image/", ".").replace("audio/", "."))
          .join(", ")}`
      );
      return;
    }

    // Client-side file size validation
    if (file.size > policy.maxSizeBytes) {
      const maxMb = Math.round(policy.maxSizeBytes / (1024 * 1024));
      toast.error(`File is too large. Maximum allowed size is ${maxMb}MB.`);
      return;
    }

    setUploading(true);

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const targetPath = `${folder}/${pathPrefix}${Date.now()}-${sanitizedName}`;

    try {
      const blob = await upload(targetPath, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });

      setUrl(blob.url);
      onUploadComplete?.(blob.url);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleClear() {
    setUrl("");
    onUploadComplete?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden input preserves form submission data */}
      <input type="hidden" name={name} value={url} />

      {/* Hidden file selector */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept={policy.allowedMimeTypes.join(",")}
        className="hidden"
        disabled={uploading}
      />

      {url ? (
        <div className={`relative overflow-hidden rounded-lg border bg-muted ${aspectClass}`}>
          {url.match(/\.(mp3|wav|m4a|ogg|aac)($|\?)/i) || url.includes("audio") ? (
            <div className="flex h-full w-full flex-col justify-between p-4">
              <audio controls src={url} className="w-full" />
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-8 text-xs"
                >
                  {uploading ? "Uploading..." : "Change Audio"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleClear}
                  disabled={uploading}
                  className="h-8 px-2"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Image
                src={url}
                alt="Uploaded preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-8 bg-white/90 text-xs text-black hover:bg-white"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Change Image"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleClear}
                  disabled={uploading}
                  className="h-8 px-2"
                  title="Remove image"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 ${aspectClass}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-muted p-2.5 text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">
                  PNG, JPG, or WEBP up to {Math.round(policy.maxSizeBytes / (1024 * 1024))}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback direct URL input option */}
      {allowUrlInput && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">or enter image URL:</span>
          <Input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              onUploadComplete?.(e.target.value);
            }}
            placeholder="https://..."
            className="h-7 text-xs"
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}
