import { ContentTabs } from "@/components/layout/content-tabs";

export default function AdminContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <ContentTabs />
      {children}
    </div>
  );
}
