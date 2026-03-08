import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Departments",
  description: "Explore the departments and ministries at AG Wuse Church.",
};

const CATEGORY_LABELS: Record<string, string> = {
  MINISTRY: "Ministries & Groups",
  CHOIR: "Music & Worship",
  COMMITTEE: "Operational Committees",
  OUTREACH: "Media & Outreach",
};

const CATEGORY_ORDER = ["MINISTRY", "CHOIR", "COMMITTEE", "OUTREACH"];

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: { leader: { select: { firstName: true, lastName: true } } },
    orderBy: { name: "asc" },
  });

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    departments: departments.filter((d) => d.category === cat),
  }));

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Departments</h1>
          <p className="text-lg text-muted-foreground">
            Our church operates through various departments and ministries,
            each contributing to the growth and welfare of the congregation.
          </p>
        </div>

        <div className="space-y-12">
          {grouped.map(
            (group) =>
              group.departments.length > 0 && (
                <section key={group.category}>
                  <h2 className="mb-6 text-2xl font-bold">{group.label}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="rounded-lg border bg-card p-5"
                      >
                        <h3 className="font-semibold">{dept.name}</h3>
                        {dept.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {dept.description}
                          </p>
                        )}
                        {dept.leader && (
                          <p className="mt-2 text-xs text-brand-gold-dark">
                            Led by {dept.leader.firstName}{" "}
                            {dept.leader.lastName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
          )}
        </div>
      </div>
    </div>
  );
}
