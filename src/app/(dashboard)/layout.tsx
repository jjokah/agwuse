import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar
        userRole={session.user.role}
        userName={session.user.name || "Member"}
      />
      <SidebarInset data-surface="dashboard">
        <DashboardTopbar />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 outline-none">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
