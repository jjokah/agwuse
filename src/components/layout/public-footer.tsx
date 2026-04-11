import Image from "next/image";
import Link from "next/link";
import { CHURCH_INFO } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border/50 bg-card px-4 pt-16 pb-8 text-muted-foreground transition-colors duration-300">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px] z-0" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[100px] z-0" />
      
      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Church Info */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/ag-logo.png"
              alt={CHURCH_INFO.shortName}
              width={40}
              height={40}
              className="drop-shadow-md"
            />
            <span className="font-bold tracking-tight text-foreground text-lg">
              {CHURCH_INFO.shortName}
            </span>
          </div>
          <p className="text-sm italic text-primary/80">
            {CHURCH_INFO.tagline}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="mb-3 font-semibold text-foreground">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/about", label: "About Us" },
              { href: "/ministers", label: "Ministers" },
              { href: "/departments", label: "Departments" },
              { href: "/blog", label: "Blog" },
              { href: "/events", label: "Events" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className="inline-block hover:text-primary hover:translate-x-1 transition-all duration-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-3 font-semibold text-foreground">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">{CHURCH_INFO.address}</li>
            {CHURCH_INFO.phones.map((phone) => (
              <li key={phone}>{phone}</li>
            ))}
            <li>
              <a
                href={`mailto:${CHURCH_INFO.email}`}
                className="inline-block hover:text-primary transition-colors duration-300"
              >
                {CHURCH_INFO.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Give */}
        <div>
          <h4 className="mb-3 font-semibold text-foreground">Give</h4>
          <ul className="space-y-2 text-sm">
            <li>{CHURCH_INFO.bankName}</li>
            <li className="font-mono text-primary font-medium">
              {CHURCH_INFO.bankAccount}
            </li>
            <li className="mt-4">
              <Link 
                href="/give" 
                className="inline-flex items-center text-primary font-medium hover:text-primary/80 hover:translate-x-1 transition-all duration-300"
              >
                Give Online &rarr;
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 mx-auto mt-12 max-w-7xl border-t border-border/50 pt-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center text-sm md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {CHURCH_INFO.name}. All rights
            reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors duration-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
