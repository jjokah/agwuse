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

import type { PublicChurchInfo } from "@/lib/settings/schema";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchInfo?: Partial<PublicChurchInfo>;
}

export function MobileNav({ open, onOpenChange, churchInfo }: MobileNavProps) {
  const pathname = usePathname();
  const info = { ...CHURCH_INFO, ...churchInfo };

  const linkClass = (href: string) =>
    cn(
      "border-l-2 border-transparent px-3 py-2 text-sm transition-colors hover:text-gold-deep",
      pathname === href
        ? "border-brand-gold font-medium text-gold-deep"
        : "text-ink"
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 overflow-y-auto p-0">
        <SheetHeader className="border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/ag-logo.png"
              alt={info.shortName}
              width={36}
              height={36}
            />
            <div className="flex flex-col text-left">
              <SheetTitle className="text-base font-bold text-brand-navy">
                {info.shortName}
              </SheetTitle>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-deep">
                {info.tagline}
              </span>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex flex-col px-2 py-3">
          {NAV_ITEMS.public
            .filter((item) => !("href" in item && item.href === "/give"))
            .map((item) => {
              if ("children" in item && item.children) {
                return (
                  <div key={item.label} className="mb-1">
                    <span className="block px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep">
                      {item.label}
                    </span>
                    <div className="flex flex-col">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => onOpenChange(false)}
                          className={linkClass(child.href)}
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
                  className={cn(linkClass(link.href), "font-medium")}
                >
                  {link.label}
                </Link>
              );
            })}
        </nav>

        <div className="mt-auto space-y-4 border-t px-4 py-5">
          <div className="flex gap-3">
            <Link
              href="/give"
              onClick={() => onOpenChange(false)}
              className="flex h-10 flex-1 items-center justify-center rounded-full bg-brand-gold text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-dark"
            >
              Give
            </Link>
            <Link
              href="/login"
              onClick={() => onOpenChange(false)}
              className="flex h-10 flex-1 items-center justify-center rounded-full border border-ink/20 text-sm font-semibold text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
            >
              Login
            </Link>
          </div>
          <div className="text-xs leading-relaxed text-ink-soft">
            <p>{info.address}</p>
            <p className="mt-1">{info.phones[0]}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
