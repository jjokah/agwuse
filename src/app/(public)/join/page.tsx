import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";
import { PageHero } from "@/components/public/page-hero";
import { CTABanner } from "@/components/public/cta-banner";

export const metadata: Metadata = {
  title: "Join Us",
  description: `Become a member of ${CHURCH_INFO.name}. Register and join our church family.`,
};

const BENEFITS = [
  {
    title: "Spiritual Growth",
    description:
      "Access Bible study groups, prayer meetings, and discipleship programs.",
  },
  {
    title: "Fellowship",
    description:
      "Connect with other believers and build lasting relationships in faith.",
  },
  {
    title: "Ministry Opportunities",
    description:
      "Serve in one of our 23 departments, from worship to outreach.",
  },
  {
    title: "Member Portal",
    description:
      "Track your giving, access the member directory, and stay updated.",
  },
];

export default function JoinPage() {
  return (
    <>
      <PageHero
        eyebrow="Become Family"
        title="Join Us"
        description="We warmly welcome you to become a part of the AG Wuse family. Register to become a member and connect with our community of believers."
        image={{
          src: "/images/gallery/ag-wuse-08.jpg",
          alt: "Members of the AG Wuse congregation",
        }}
        align="left"
      />

      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto grid max-w-3xl gap-x-12 gap-y-10 sm:grid-cols-2">
          {BENEFITS.map((item) => (
            <div key={item.title} className="flex gap-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-gold" />
              <div>
                <h3 className="font-medium text-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-16 text-center text-sm text-ink-soft">
          Already a member?{" "}
          <Link
            href="/login"
            className="font-semibold text-gold-deep hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>

      <CTABanner
        variant="gold"
        eyebrow="Ready?"
        title="Take your place in the family"
        description="Create an account to get started. After registration, your account will be verified and activated."
        primary={{ label: "Register Now", href: "/register" }}
        secondary={{ label: "Talk to Us First", href: "/contact" }}
      />
    </>
  );
}
