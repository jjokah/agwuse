"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NAV_ITEMS, CHURCH_INFO } from "@/lib/constants";
import { MobileNav } from "./mobile-nav";
import { useState } from "react";

import type { ChurchInfo } from "@/lib/settings/schema";

const triggerClass =
  "bg-transparent text-[13px] font-medium uppercase tracking-wide text-ink hover:text-gold-deep data-[state=open]:text-gold-deep";

interface PublicHeaderProps {
  churchInfo?: Partial<ChurchInfo>;
}

export function PublicHeader({ churchInfo }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const info = { ...CHURCH_INFO, ...churchInfo };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        {/* Logo lockup */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/ag-logo.png"
            alt={info.shortName}
            width={40}
            height={40}
          />
          <span className="hidden flex-col sm:flex">
            <span className="text-lg font-bold leading-tight text-brand-navy">
              {info.shortName}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
              {info.tagline}
            </span>
          </span>
        </Link>

        {/* Desktop Navigation (Give lives in the right-side pill) */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {NAV_ITEMS.public
              .filter((item) => !("href" in item && item.href === "/give"))
              .map((item) => {
                if ("children" in item && item.children) {
                  return (
                    <NavigationMenuItem key={item.label}>
                      <NavigationMenuTrigger className={triggerClass}>
                        {item.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-56 gap-1 p-2">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <NavigationMenuLink
                                href={child.href}
                                data-active={
                                  pathname === child.href ? "" : undefined
                                }
                                className="text-sm data-active:text-gold-deep"
                              >
                                {child.label}
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }
                const link = item as { label: string; href: string };
                return (
                  <NavigationMenuItem key={link.label}>
                    <NavigationMenuLink
                      href={link.href}
                      data-active={pathname === link.href ? "" : undefined}
                      className={`inline-flex h-9 items-center justify-center rounded-lg px-2.5 py-1.5 transition-colors ${triggerClass}`}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side: Give + Login + Mobile menu */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-[13px] font-medium uppercase tracking-wide text-ink-soft transition-colors hover:text-gold-deep sm:inline-block"
          >
            Login
          </Link>
          <Link
            href="/give"
            className="hidden h-10 items-center justify-center rounded-full bg-brand-gold px-6 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-dark sm:inline-flex"
          >
            Give
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} churchInfo={info} />
    </header>
  );
}
