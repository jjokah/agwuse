"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Display export failures in the page instead of silently downloading an error response. */
export function DownloadButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function download() {
    setError(""); setLoading(true);
    try {
      const response = await fetch(href);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Download failed. Please try again.");
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "export.csv";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : "Download failed"); }
    finally { setLoading(false); }
  }
  return <div className="space-y-2">
    <Button type="button" variant="outline" disabled={loading} aria-busy={loading} onClick={() => void download()}>{loading ? "Preparing download..." : children}</Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
