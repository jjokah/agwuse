import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { PersonCard } from "@/components/public/person-card";

export const metadata: Metadata = {
  title: "Ministers",
  description: "Meet the ministers and pastoral team at AG Wuse Church.",
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

export default function MinistersPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Shepherds"
        title="Meet Our Ministers"
        description="The pastoral team leading AG Wuse with dedication and love for God's people."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl space-y-16">
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
      </div>
    </>
  );
}
