import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { ChurchJsonLd } from "@/components/seo/json-ld";
import { getChurchInfo } from "@/lib/settings";
import { toPublicChurchInfo } from "@/lib/settings/schema";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const churchInfo = await getChurchInfo();

  return (
    <div data-surface="public" className="flex min-h-screen flex-col">
      <ChurchJsonLd churchInfo={churchInfo} />
      {/* Client component: pass only public fields (never notification emails) */}
      <PublicHeader churchInfo={toPublicChurchInfo(churchInfo)} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter churchInfo={churchInfo} />
    </div>
  );
}
