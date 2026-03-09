"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  profile: "Profile",
  "my-giving": "My Giving",
  directory: "Directory",
  admin: "Admin",
  finance: "Finance",
  users: "Users",
  content: "Content",
  settings: "Settings",
  blog: "Blog",
  record: "Record Transaction",
  reports: "Reports",
  pledges: "Pledges",
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/");
            const isLast = index === segments.length - 1;
            const label = LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

            return isLast ? (
              <BreadcrumbItem key={href}>
                <BreadcrumbPage>{label}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <Fragment key={href}>
                <BreadcrumbItem>
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
