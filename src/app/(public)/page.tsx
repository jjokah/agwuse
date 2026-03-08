import Image from "next/image";
import Link from "next/link";
import { CHURCH_INFO, WEEKLY_ACTIVITIES } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative flex min-h-[600px] items-center justify-center bg-brand-navy px-4 text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/90 to-brand-navy/70" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Image
            src="/ag-logo.png"
            alt="AG Wuse Church Logo"
            width={120}
            height={120}
            className="mx-auto mb-6"
            priority
          />
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Welcome to {CHURCH_INFO.shortName}
          </h1>
          <p className="mb-2 text-xl text-brand-gold-light sm:text-2xl">
            {CHURCH_INFO.tagline}
          </p>
          <p className="mb-8 text-lg text-gray-300">{CHURCH_INFO.name}</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/about"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-gold px-6 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-gold-dark"
            >
              Learn More
            </Link>
            <Link
              href="/give"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-gold px-6 text-sm font-medium text-brand-gold transition-colors hover:bg-brand-gold/10"
            >
              Give Online
            </Link>
          </div>
        </div>
      </section>

      {/* Service Times */}
      <section className="border-b bg-brand-gold px-4 py-6 text-brand-navy">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 text-sm font-medium sm:text-base">
          {WEEKLY_ACTIVITIES.map((activity) => (
            <div key={activity.day} className="flex items-center gap-2">
              <span className="font-bold">{activity.day}:</span>
              <span>{activity.activity}</span>
              <span className="text-brand-navy/70">({activity.time})</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Info Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Welcome Home</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {CHURCH_INFO.name} is a vibrant community of believers committed
              to the Word of God, worship, and service. We welcome you to join
              us as we grow together in faith.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Join Us",
                description:
                  "Become a member and grow in fellowship with us.",
                href: "/join",
              },
              {
                title: "Give",
                description:
                  "Support the work of God through tithes, offerings, and donations.",
                href: "/give",
              },
              {
                title: "Prayer Request",
                description:
                  "Share your prayer needs with us. We believe in the power of prayer.",
                href: "/prayer-request",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-lg border bg-card p-6 transition-colors hover:border-brand-gold hover:bg-accent"
              >
                <h3 className="mb-2 text-xl font-semibold group-hover:text-brand-gold-dark">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
