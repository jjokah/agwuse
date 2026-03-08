import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Church Board",
  description: "Meet the elders and board members of AG Wuse Church.",
};

const BOARD_MEMBERS = [
  { name: "Elder Gabriel Ebemiele", role: "Board Member" },
  { name: "Elder Bernard Oshiogwehom", role: "Board Member (Pioneer)" },
  { name: "Elder Emeka Onyiriuka", role: "Secretary" },
  { name: "Elder Solomon Achibong", role: "Treasurer (Fellow, ICAN)" },
  { name: "Elder Peter Odeh", role: "Board Member" },
  { name: "Elder Sunday Okezie", role: "Board Member" },
];

export default function BoardPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Church Board</h1>
          <p className="text-lg text-muted-foreground">
            Our church board comprises dedicated elders who provide spiritual
            oversight and guidance for the congregation.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BOARD_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center rounded-lg border bg-card p-6 text-center"
            >
              <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-brand-navy/10">
                <Image
                  src="/ag-logo.png"
                  alt={member.name}
                  width={40}
                  height={40}
                  className="opacity-50"
                />
              </div>
              <h3 className="font-semibold">{member.name}</h3>
              <p className="text-sm text-brand-gold-dark">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
