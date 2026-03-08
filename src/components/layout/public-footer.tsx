import Image from "next/image";
import Link from "next/link";
import { CHURCH_INFO } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t bg-brand-navy px-4 py-12 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Church Info */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/ag-logo.png"
              alt={CHURCH_INFO.shortName}
              width={40}
              height={40}
            />
            <span className="font-bold text-white">
              {CHURCH_INFO.shortName}
            </span>
          </div>
          <p className="text-sm italic text-brand-gold-light">
            {CHURCH_INFO.tagline}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="mb-3 font-semibold text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-brand-gold">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/ministers" className="hover:text-brand-gold">
                Ministers
              </Link>
            </li>
            <li>
              <Link href="/departments" className="hover:text-brand-gold">
                Departments
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-brand-gold">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-brand-gold">
                Events
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand-gold">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-3 font-semibold text-white">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>{CHURCH_INFO.address}</li>
            {CHURCH_INFO.phones.map((phone) => (
              <li key={phone}>{phone}</li>
            ))}
            <li>
              <a
                href={`mailto:${CHURCH_INFO.email}`}
                className="hover:text-brand-gold"
              >
                {CHURCH_INFO.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Give */}
        <div>
          <h4 className="mb-3 font-semibold text-white">Give</h4>
          <ul className="space-y-2 text-sm">
            <li>{CHURCH_INFO.bankName}</li>
            <li className="font-mono text-brand-gold">
              {CHURCH_INFO.bankAccount}
            </li>
            <li>
              <Link href="/give" className="hover:text-brand-gold">
                Give Online &rarr;
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-8 max-w-7xl border-t border-gray-700 pt-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center text-sm sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {CHURCH_INFO.name}. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-brand-gold">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand-gold">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
