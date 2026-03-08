import type { Metadata } from "next";
import Image from "next/image";

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
    image: "/images/pastor-placeholder.png",
  },
  {
    name: "Rev. Churchman Felix",
    title: "Assistant Pastor",
    description:
      "Rev. Felix ably supports the Senior Pastor in promoting the work of God in the church. His dedication and commitment to ministry have been instrumental in the growth and spiritual development of the congregation.",
    image: "/images/pastor-placeholder.png",
  },
  {
    name: "Rev. Jeff Alex",
    title: "Children Pastor",
    description:
      "A vibrant and dynamic minister overseeing the children's ministry. Rev. Alex is passionate about nurturing young hearts in the faith and equipping the next generation for Christ.",
    image: "/images/pastor-placeholder.png",
  },
];

export default function MinistersPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Our Ministers</h1>
          <p className="text-lg text-muted-foreground">
            Meet the pastoral team leading AG Wuse with dedication and love for
            God&apos;s people.
          </p>
        </div>

        <div className="space-y-12">
          {MINISTERS.map((minister) => (
            <div
              key={minister.name}
              className="flex flex-col items-center gap-6 rounded-lg border bg-card p-6 sm:flex-row sm:items-start"
            >
              <div className="flex size-32 shrink-0 items-center justify-center rounded-full bg-brand-navy/10">
                <Image
                  src="/ag-logo.png"
                  alt={minister.name}
                  width={64}
                  height={64}
                  className="opacity-50"
                />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold">{minister.name}</h2>
                <p className="mb-3 font-medium text-brand-gold-dark">
                  {minister.title}
                </p>
                <p className="text-muted-foreground">{minister.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
