"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  Users,
  UserCog,
  BarChart3,
  PlusCircle,
  FileText,
  Shield,
  Wallet,
  FileEdit,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { CHURCH_INFO } from "@/lib/constants";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Heart,
  Users,
  UserCog,
  BarChart3,
  PlusCircle,
  FileText,
  Shield,
  Wallet,
  FileEdit,
  Settings,
};

const MEMBER_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "My Giving", href: "/my-giving", icon: "Heart" },
  { label: "Directory", href: "/directory", icon: "Users" },
  { label: "Profile", href: "/profile", icon: "UserCog" },
];

const FINANCE_NAV = [
  { label: "Finance Dashboard", href: "/finance", icon: "BarChart3" },
  { label: "Record Transaction", href: "/finance/record", icon: "PlusCircle" },
  { label: "Reports", href: "/finance/reports", icon: "FileText" },
];

const ADMIN_NAV = [
  { label: "Admin Dashboard", href: "/admin", icon: "Shield" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Finance", href: "/admin/finance", icon: "Wallet" },
  { label: "Content", href: "/admin/content/blog", icon: "FileEdit" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
];

interface DashboardSidebarProps {
  userRole: string;
  userName: string;
}

const FINANCE_ROLES = ["FINANCE", "ADMIN", "SUPER_ADMIN"];
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export function DashboardSidebar({ userRole, userName }: DashboardSidebarProps) {
  const pathname = usePathname();

  const showFinance = FINANCE_ROLES.includes(userRole);
  const showAdmin = ADMIN_ROLES.includes(userRole);

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/ag-logo.png"
            alt={CHURCH_INFO.shortName}
            width={28}
            height={28}
          />
          <span className="text-sm font-bold">{CHURCH_INFO.shortName}</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Member Nav */}
        <SidebarGroup>
          <SidebarGroupLabel>Member</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MEMBER_NAV.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        {Icon && <Icon className="size-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance Nav */}
        {showFinance && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Finance</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {FINANCE_NAV.map((item) => {
                    const Icon = ICONS[item.icon];
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith(item.href)}
                        >
                          <Link href={item.href}>
                            {Icon && <Icon className="size-4" />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Admin Nav */}
        {showAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ADMIN_NAV.map((item) => {
                    const Icon = ICONS[item.icon];
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith(item.href)}
                        >
                          <Link href={item.href}>
                            {Icon && <Icon className="size-4" />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="mb-2 truncate text-sm font-medium">{userName}</div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
