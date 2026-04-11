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

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg shadow-sm supports-backdrop-filter:bg-background/60 transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/ag-logo.png"
            alt={CHURCH_INFO.shortName}
            width={36}
            height={36}
          />
          <span className="hidden font-bold tracking-tight text-foreground sm:inline-block">
            {CHURCH_INFO.shortName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {NAV_ITEMS.public.map((item) => {
              if ("children" in item && item.children) {
                return (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuTrigger className="group/link bg-transparent! transition-all duration-300 hover:text-primary hover:-translate-y-0.5 data-[state=open]:text-primary">
                      <span className="relative py-1 after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-primary after:transition-all after:duration-300 group-hover/link:after:w-full group-data-[state=open]/link:after:w-full">
                        {item.label}
                      </span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-48 gap-1 p-2">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <NavigationMenuLink
                              href={child.href}
                              data-active={pathname === child.href ? "" : undefined}
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
                    className="group/link bg-transparent! inline-flex h-9 items-center justify-center px-4 py-1.5 text-sm font-medium transition-all duration-300 hover:text-primary hover:-translate-y-0.5 data-active:text-primary data-active:font-semibold"
                  >
                    <span className="relative py-1 after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-primary after:transition-all after:duration-300 group-hover/link:after:w-full group-data-active/link:after:w-full">
                      {link.label}
                    </span>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side: Login + Mobile menu */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-9 items-center justify-center rounded-full bg-primary text-primary-foreground px-6 text-sm font-medium transition-all duration-300 hover:shadow-[0_4px_14px_0_var(--color-primary)] sm:inline-flex"
          >
            Login
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
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
