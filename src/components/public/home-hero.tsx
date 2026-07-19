import Image from "next/image";
import Link from "next/link";
import { CHURCH_INFO } from "@/lib/constants";

/** Full-bleed editorial hero for the home page. */
export function HomeHero() {
  return (
    <section className="relative flex min-h-[85svh] items-end overflow-hidden bg-brand-navy">
      <Image
        src="/images/hero/home-main.jpg"
        alt="Worship service at AG Wuse"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/55 to-brand-navy/20" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-40 sm:pb-24">
        <p className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">
          Assemblies of God &middot; Wuse Zone 5 &middot; Abuja
        </p>
        <h1 className="font-display motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-150 motion-safe:fill-mode-both mt-4 max-w-3xl text-5xl font-medium tracking-tight text-white sm:text-6xl lg:text-7xl">
          A Center of Love&nbsp;&amp; Worship
        </h1>
        <p className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-300 motion-safe:fill-mode-both mt-5 max-w-xl text-lg leading-relaxed text-white/80">
          {CHURCH_INFO.name}. Join us this Sunday at {CHURCH_INFO.address}.
        </p>
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-300 motion-safe:fill-mode-both mt-9 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand-gold px-8 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
          >
            Plan Your Visit
          </Link>
          <Link
            href="/live"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-8 text-sm font-semibold text-white transition-colors hover:border-brand-gold hover:text-brand-gold"
          >
            Watch Live
          </Link>
        </div>
      </div>
    </section>
  );
}
