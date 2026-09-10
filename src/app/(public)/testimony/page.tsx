import type { Metadata } from "next";
import { SubmissionForm } from "@/components/forms/submission-form";
import { submitTestimony } from "@/lib/actions/submission-actions";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/public/page-hero";
import { ScriptureQuote } from "@/components/public/scripture-quote";
import { SectionHeading } from "@/components/public/section-heading";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Share Testimony",
  description: "Share your testimony of what God has done in your life.",
};

async function getTestimonies() {
  try {
    return await prisma.submission.findMany({
      where: { type: "TESTIMONY", status: "APPROVED", isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  } catch (err) {
    console.error("Failed to load testimonies:", err);
    return [];
  }
}

export default async function TestimonyPage() {
  const testimonies = await getTestimonies();

  return (
    <>
      <PageHero
        eyebrow="God at Work"
        title="Share Your Testimony"
        description="Tell us what God has done for you. Your testimony could encourage someone else."
      />

      <div className="px-4 py-16 sm:py-20">
        <ScriptureQuote
          verse="And they overcame him by the blood of the Lamb, and by the word of their testimony."
          reference="Revelation 12:11"
        />
      </div>

      <div className="px-4 pb-20 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-paper p-8 shadow-warm sm:p-10">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
              Your Testimony
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Share your testimony and choose whether to make it public for
              others to read.
            </p>
            <div className="mt-8">
              <SubmissionForm type="testimony" onSubmit={submitTestimony} />
            </div>
          </div>

          {testimonies.length > 0 && (
            <section className="mt-20">
              <SectionHeading eyebrow="Praise Reports" title="Testimonies" />
              <div className="mt-8 space-y-6">
                {testimonies.map((t) => (
                  <figure
                    key={t.id}
                    className="rounded-3xl border-l-4 border-brand-gold bg-paper p-7 shadow-warm"
                  >
                    <blockquote className="leading-relaxed text-ink-soft">
                      {t.content}
                    </blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                      <span className="h-px w-6 bg-brand-gold" />
                      <span className="text-sm font-semibold text-ink">
                        {t.name}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
