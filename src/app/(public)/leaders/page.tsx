import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/public/page-hero";
import { SectionHeading } from "@/components/public/section-heading";
import { PersonCard } from "@/components/public/person-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaders",
  description:
    "Meet the ministers, church board, and departmental heads leading AG Wuse Church.",
};

const MINISTERS = [
  {
    name: "Rev. Anthony Eseh",
    title: "Senior Pastor",
    description:
      "District Secretary of Abuja District. A seasoned minister, teacher, writer, and marriage counselor. Rev. Eseh has been in full-time ministry since 1991 and leads the church with wisdom, grace, and a heart for God's people.",
    image: "/images/ministers/anthony-eseh.jpg",
  },
  {
    name: "Rev. Churchman Felix",
    title: "Assistant Pastor",
    description:
      "Rev. Felix ably supports the Senior Pastor in promoting the work of God in the church. His dedication and commitment to ministry have been instrumental in the growth and spiritual development of the congregation.",
    image: "/images/ministers/churchman-felix.jpg",
  },
  {
    name: "Rev. Jeff Alex",
    title: "Children Pastor",
    description:
      "A vibrant and dynamic minister overseeing the children's ministry. Rev. Alex is passionate about nurturing young hearts in the faith and equipping the next generation for Christ.",
    image: "/images/ministers/jeff-alex.jpg",
  },
];

const BOARD_MEMBERS = [
  {
    name: "Elder Gabriel Ebemiele",
    role: "Board Member",
    image: "/images/board/gabriel-ebemiele.png",
  },
  {
    name: "Elder Bernard Oshiogwehom",
    role: "Board Member (Pioneer)",
    image: "/images/board/bernard-oshiogwehom.png",
  },
  {
    name: "Elder Emeka Onyiriuka",
    role: "Secretary",
    image: "/images/board/emeka-onyiriuka.png",
  },
  {
    name: "Elder Solomon Achibong",
    role: "Treasurer (Fellow, ICAN)",
    image: "/images/board/solomon-achibong.png",
  },
  {
    name: "Elder Peter Odeh",
    role: "Board Member",
    image: "/images/board/peter-odeh.png",
  },
  { name: "Elder Sunday Okezie", role: "Board Member", image: null },
];

/** Departmental heads are DB-backed, but ministers and the board are static.
 *  A database outage must not take down the rest of the page. */
async function getDepartmentHeads() {
  try {
    return await prisma.department.findMany({
      where: { isActive: true, leaderId: { not: null } },
      include: {
        leader: { select: { firstName: true, lastName: true, image: true } },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to load departmental heads:", error);
    return [];
  }
}

export default async function LeadersPage() {
  const departmentsWithLeaders = await getDepartmentHeads();

  return (
    <>
      <PageHero
        eyebrow="Our Shepherds"
        title="Our Leaders"
        description="Meet the ministers, elders, and departmental heads who shepherd AG Wuse Church."
      />

      {/* Ministers */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl space-y-16">
          <SectionHeading eyebrow="Pastoral Team" title="Ministers" align="left" />
          {MINISTERS.map((minister) => (
            <PersonCard
              key={minister.name}
              name={minister.name}
              role={minister.title}
              bio={minister.description}
              image={minister.image}
              size="lg"
            />
          ))}
        </div>
      </section>

      {/* Church Board */}
      <section className="bg-cream-deep px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Spiritual Oversight"
            title="Church Board"
            description="Our church board comprises dedicated elders who provide spiritual oversight and guidance for the congregation."
            align="center"
            className="mx-auto"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BOARD_MEMBERS.map((member) => (
              <PersonCard
                key={member.name}
                name={member.name}
                role={member.role}
                image={member.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Departmental Heads */}
      {departmentsWithLeaders.length > 0 && (
        <section className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              eyebrow="Serving in Ministry"
              title="Departmental Heads"
              description="Leaders raised up to guide our departments and ministries."
              align="center"
              className="mx-auto"
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {departmentsWithLeaders.map((dept) => (
                <PersonCard
                  key={dept.id}
                  name={`${dept.leader!.firstName} ${dept.leader!.lastName}`}
                  role={dept.name}
                  image={dept.leader!.image}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
