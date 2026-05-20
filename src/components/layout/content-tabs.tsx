"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const CONTENT_TABS = [
  { label: "Blog", href: "/admin/content/blog" },
  { label: "Sermons", href: "/admin/content/sermons" },
  { label: "Events", href: "/admin/content/events" },
  { label: "Gallery", href: "/admin/content/gallery" },
  { label: "Live Stream", href: "/admin/content/livestream" },
  { label: "Moderation", href: "/admin/content/moderation" },
];

export function ContentTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
      {CONTENT_TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname.startsWith(tab.href)
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
