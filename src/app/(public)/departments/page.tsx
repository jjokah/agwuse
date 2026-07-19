import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/public/page-hero";
import { Eyebrow } from "@/components/public/section-heading";

export const dynamic = "force-dynamic";

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
  })).filter((group) => group.departments.length > 0);

  return (
    <>
      <PageHero
        eyebrow="Serve With Us"
        title="Departments"
        description="Our church operates through various departments and ministries, each contributing to the growth and welfare of the congregation."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl space-y-16">
          {grouped.map((group, groupIndex) => (
            <div key={group.category}>
              {/* Photo band midway to break up the card groups */}
              {groupIndex === 2 && (
                <div className="relative mb-16 overflow-hidden rounded-3xl shadow-warm">
                  <Image
                    src="/images/sections/choir.jpg"
                    alt="The choir ministering at AG Wuse"
                    width={1024}
                    height={768}
                    className="aspect-[16/6] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 to-transparent" />
                  <p className="font-display absolute bottom-5 left-6 text-xl font-medium text-white sm:text-2xl">
                    Every gift has a place of service
                  </p>
                </div>
              )}
              <section>
                <div className="mb-8 flex items-center gap-6">
                  <div>
                    <Eyebrow className="mb-2">
                      {group.departments.length}{" "}
                      {group.departments.length === 1 ? "department" : "departments"}
                    </Eyebrow>
                    <h2 className="font-display whitespace-nowrap text-3xl font-medium tracking-tight text-ink">
                      {group.label}
                    </h2>
                  </div>
                  <div className="mt-6 h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex flex-col rounded-3xl bg-paper p-6 shadow-warm"
                    >
                      <h3 className="font-medium text-ink">{dept.name}</h3>
                      {dept.description && (
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                          {dept.description}
                        </p>
                      )}
                      {dept.leader && (
                        <p className="mt-auto pt-3 text-xs font-semibold uppercase tracking-[0.15em] text-gold-deep">
                          Led by {dept.leader.firstName} {dept.leader.lastName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
