"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS, CHURCH_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 overflow-y-auto p-0">
        <SheetHeader className="border-b px-4 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/ag-logo.png"
              alt={CHURCH_INFO.shortName}
              width={32}
              height={32}
            />
            <SheetTitle className="text-base font-bold">
              {CHURCH_INFO.shortName}
            </SheetTitle>
          </div>
        </SheetHeader>

        <nav className="flex flex-col px-2 py-3">
          {NAV_ITEMS.public.map((item) => {
            if ("children" in item && item.children) {
              return (
                <div key={item.label} className="mb-1">
                  <span className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                  <div className="mt-1 flex flex-col">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                          pathname === child.href && "bg-muted font-medium text-brand-gold-dark"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                  <Separator className="my-2" />
                </div>
              );
            }
            const link = item as { label: string; href: string };
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  pathname === link.href && "bg-muted text-brand-gold-dark"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t px-4 py-4">
          <Link
            href="/login"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-brand-gold text-sm font-medium text-brand-navy transition-colors hover:bg-brand-gold-dark"
          >
            Login
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
