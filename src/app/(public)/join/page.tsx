import type { Metadata } from "next";
import Link from "next/link";
import { CHURCH_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Join Us",
  description: `Become a member of ${CHURCH_INFO.name}. Register and join our church family.`,
};

export default function JoinPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Join Us</h1>
          <p className="text-lg text-muted-foreground">
            We warmly welcome you to become a part of the AG Wuse family.
            Register to become a member and connect with our community of
            believers.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          {[
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
                "Serve in one of our 23 departments — from worship to outreach.",
            },
            {
              title: "Member Portal",
              description:
                "Track your giving, access the member directory, and stay updated.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border bg-card p-5">
              <h3 className="mb-1 font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-lg border-2 border-brand-gold bg-card p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold">Ready to Join?</h2>
          <p className="mb-6 text-muted-foreground">
            Create an account to get started. After registration, your account
            will be verified and activated.
          </p>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-gold px-8 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-gold-dark"
          >
            Register Now
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Already a member?{" "}
            <Link href="/login" className="text-brand-gold-dark hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
