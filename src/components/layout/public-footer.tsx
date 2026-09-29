import Image from "next/image";
import Link from "next/link";
import { CHURCH_INFO, WEEKLY_ACTIVITIES } from "@/lib/constants";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">
      {children}
    </h4>
  );
}

import type { ChurchInfo } from "@/lib/settings/schema";

interface PublicFooterProps {
  churchInfo?: Partial<ChurchInfo>;
}

export function PublicFooter({ churchInfo }: PublicFooterProps) {
  const info = { ...CHURCH_INFO, ...churchInfo };
  const sunday = info.service_times?.[0] || `${WEEKLY_ACTIVITIES[0].day} ${WEEKLY_ACTIVITIES[0].time}`;

  return (
    <footer className="mt-auto bg-brand-navy px-4 pb-10 text-white/70">
      {/* Pre-footer invitation */}
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 border-b border-white/10 py-14 sm:flex-row sm:items-center">
        <p className="font-display max-w-xl text-2xl font-medium tracking-tight text-white sm:text-3xl">
          Join us this Sunday: {sunday}.
          <span className="text-brand-gold-light"> You are welcome home.</span>
        </p>
        <Link
          href="/contact"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-brand-gold px-8 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
        >
          Plan Your Visit
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Church Info */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/ag-logo.png"
              alt={info.shortName}
              width={40}
              height={40}
            />
            <span className="font-bold text-white">{info.shortName}</span>
          </div>
          <p className="font-display text-sm italic text-brand-gold-light">
            {info.tagline}
          </p>
          <ul className="mt-4 space-y-1 text-sm">
            {info.facebook.map((page) => (
              <li key={page}>{page}</li>
            ))}
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <ColumnHeading>Quick Links</ColumnHeading>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="transition-colors hover:text-brand-gold">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/sermons" className="transition-colors hover:text-brand-gold">
                Sermons
              </Link>
            </li>
            <li>
              <Link href="/events" className="transition-colors hover:text-brand-gold">
                Events
              </Link>
            </li>
            <li>
              <Link href="/departments" className="transition-colors hover:text-brand-gold">
                Departments
              </Link>
            </li>
            <li>
              <Link href="/give" className="transition-colors hover:text-brand-gold">
                Give Online
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-brand-gold">
                Contact &amp; Visit
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <ColumnHeading>Contact</ColumnHeading>
          <ul className="space-y-2.5 text-sm">
            <li>{info.address}</li>
            {info.phones.map((phone) => (
              <li key={phone}>{phone}</li>
            ))}
            <li>
              <a
                href={`mailto:${info.email}`}
                className="transition-colors hover:text-brand-gold"
              >
                {info.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Give */}
        <div>
          <ColumnHeading>Give</ColumnHeading>
          <ul className="space-y-2.5 text-sm">
            <li>{info.bankName}</li>
            <li className="font-mono text-lg text-brand-gold">
              {info.bankAccount}
            </li>
            <li>
              <Link href="/give" className="transition-colors hover:text-brand-gold">
                Give Online &rarr;
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto max-w-7xl border-t border-white/10 pt-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center text-sm sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {info.name}. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-brand-gold"
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-brand-gold">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
