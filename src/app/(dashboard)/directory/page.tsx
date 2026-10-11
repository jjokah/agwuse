import type { Metadata } from "next";
import { getDirectoryPage } from "@/lib/data/directory";
import { scalarParam } from "@/lib/search-params";
import { requirePageRole } from "@/lib/auth";
import { MEMBER_ROLES } from "@/lib/authz/roles";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";
import { pageMeta } from "@/lib/pagination";
import { PaginationBar } from "@/components/shared/pagination-bar";


export const metadata: Metadata = {
  title: "Member Directory",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  // Contact details of all members: church members only (not VISITOR accounts)
  await requirePageRole(MEMBER_ROLES);

  const params = await searchParams;
  const q = scalarParam(params, "q")?.trim();
  const { members, total, page, pageSize } = await getDirectoryPage(params);

  const meta = pageMeta({ totalItems: total, page, pageSize });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Member Directory</h1>
        <p className="text-muted-foreground">
          Browse and search active church members.
        </p>
      </div>

      {/* Search */}
      <form>
        <Input
          aria-label="Search member directory"
          name="q"
          placeholder="Search names, departments or shared contacts..."
          defaultValue={q || ""}
          className="max-w-sm"
        />
      </form>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={q ? "No members found" : "No active members"}
          description={
            q
              ? `No members match "${q}". Try a different search.`
              : "Members will appear here once registered and activated."
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="rounded-lg border bg-card p-4"
              >
                <p className="font-semibold">
                  {member.firstName} {member.lastName}
                </p>
                {member.email && <p className="text-sm text-muted-foreground">{member.email}</p>}
                {member.phone && (
                  <p className="text-sm text-muted-foreground">{member.phone}</p>
                )}
                {member.department && (
                  <p className="mt-1 text-xs text-brand-gold-dark">
                    {member.department.name}
                  </p>
                )}
              </div>
            ))}
          </div>

          <PaginationBar
            meta={meta}
            basePath="/directory"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
