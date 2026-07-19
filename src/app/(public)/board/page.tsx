import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { PersonCard } from "@/components/public/person-card";

export const metadata: Metadata = {
  title: "Church Board",
  description: "Meet the elders and board members of AG Wuse Church.",
};

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

export default function BoardPage() {
  return (
    <>
      <PageHero
        eyebrow="Spiritual Oversight"
        title="Church Board"
        description="Our church board comprises dedicated elders who provide spiritual oversight and guidance for the congregation."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
