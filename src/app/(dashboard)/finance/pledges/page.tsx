import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { PledgesPage } from "@/components/finance/pledges-page";
export const metadata: Metadata = { title: "Pledges" };
export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePageRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  return <PledgesPage params={searchParams ? await searchParams : {}} basePath="/finance/pledges" />;
}
