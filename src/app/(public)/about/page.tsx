import type { Metadata } from "next";
import { Star } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";
import { PageHero } from "@/components/public/page-hero";
import { SectionHeading } from "@/components/public/section-heading";
import { CTABanner } from "@/components/public/cta-banner";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${CHURCH_INFO.name}: our history, beliefs, mission and vision.`,
};

const BELIEFS = [
  { title: "The Scriptures Inspired", description: "The Bible is the inspired Word of God, the infallible, authoritative rule of faith and conduct.", cardinal: false },
  { title: "The One True God", description: "There is only one true God who exists eternally as a Trinity: Father, Son, and Holy Spirit.", cardinal: false },
  { title: "The Deity of the Lord Jesus Christ", description: "Jesus Christ is the Son of God and, as the second person of the Trinity, is fully God.", cardinal: false },
  { title: "The Fall of Man", description: "Man was created good and upright but by voluntary transgression fell, incurring physical and spiritual death.", cardinal: false },
  { title: "The Salvation of Man", description: "Salvation is received through repentance toward God and faith in the Lord Jesus Christ. Man is justified by grace through faith.", cardinal: true },
  { title: "The Ordinances of the Church", description: "Water Baptism by immersion and Holy Communion are ordinances commanded by Christ for the Church.", cardinal: false },
  { title: "The Baptism in the Holy Spirit", description: "A special experience following salvation that empowers believers for witnessing and effective service, with speaking in tongues as the initial physical evidence.", cardinal: true },
  { title: "The Initial Physical Evidence", description: "Speaking in other tongues as the Spirit gives utterance is the initial physical evidence of the baptism in the Holy Spirit.", cardinal: false },
  { title: "Sanctification", description: "A progressive, lifelong process of separating from evil and dedicating oneself to God.", cardinal: false },
  { title: "The Church and Its Mission", description: "The Church is the Body of Christ, called to worship God, evangelize the world, build a body of saints, and demonstrate compassion.", cardinal: false },
  { title: "The Ministry", description: "God calls and equips ministers for the work of the ministry, including evangelists, pastors, and teachers.", cardinal: false },
  { title: "Divine Healing", description: "Deliverance from sickness is provided for in the atonement and is the privilege of all believers.", cardinal: true },
  { title: "The Blessed Hope", description: "The rapture of the Church, the resurrection of those who have died in Christ and the catching away of living believers, is the imminent and blessed hope of the Church.", cardinal: true },
  { title: "The Millennial Reign of Christ", description: "The second coming of Christ includes the visible return of Jesus to earth to reign for a thousand years, bringing salvation and universal peace.", cardinal: false },
  { title: "The Final Judgment", description: "A final judgment for those who have rejected Christ, who will be consigned to eternal punishment.", cardinal: false },
  { title: "The New Heavens and New Earth", description: "God will create new heavens and a new earth where righteousness dwells and God will dwell with His people forever.", cardinal: false },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Who We Are"
        title="About AG Wuse"
        description={CHURCH_INFO.aka}
        image={{
          src: "/images/gallery/ag-wuse-05.jpg",
          alt: "The congregation of AG Wuse in worship",
        }}
        align="left"
      />

      {/* Who We Are */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl space-y-6 leading-relaxed text-ink-soft">
          <p className="first-letter:font-display first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:font-medium first-letter:leading-[0.85] first-letter:text-gold-deep">
            {CHURCH_INFO.name} (also known as {CHURCH_INFO.aka}) is a vibrant
            Pentecostal church located in the heart of Abuja, Nigeria. As part
            of the Assemblies of God Nigeria, we are committed to the
            proclamation of the Gospel, the empowerment of believers, and
            service to our community.
          </p>
          <p>
            Our church is a &quot;{CHURCH_INFO.tagline}&quot;: a place where
            people from all walks of life come together to worship God, grow in
            faith, and serve one another. We believe in the power of God&apos;s
            Word, the ministry of the Holy Spirit, and the transforming grace of
            Jesus Christ.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="px-4 pb-20 sm:pb-24">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border-t-4 border-brand-gold bg-paper p-8 shadow-warm">
            <h3 className="font-display text-2xl font-medium tracking-tight text-ink">
              Our Mission
            </h3>
            <p className="mt-4 leading-relaxed text-ink-soft">
              To worship God, evangelize the lost, disciple believers, and
              demonstrate compassion through the power of the Holy Spirit,
              building a vibrant community of faith in Wuse and beyond.
            </p>
          </div>
          <div className="rounded-3xl border-t-4 border-brand-gold bg-paper p-8 shadow-warm">
            <h3 className="font-display text-2xl font-medium tracking-tight text-ink">
              Our Vision
            </h3>
            <p className="mt-4 leading-relaxed text-ink-soft">
              To be a dynamic, Spirit-filled church that impacts our city and
              nation for Christ: raising leaders, strengthening families, and
              transforming lives through the Gospel.
            </p>
          </div>
        </div>
      </section>

      {/* Statement of Faith */}
      <section className="bg-cream-deep px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Fundamental Truths"
            title="Statement of Faith"
            description="We hold to the Assemblies of God Statement of Fundamental Truths, 16 doctrines rooted in Scripture. Those marked with a star are the four Cardinal Doctrines."
            align="center"
          />
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {BELIEFS.map((belief, index) => (
              <div key={belief.title} className="flex gap-5">
                <span
                  aria-hidden
                  className="font-display w-10 shrink-0 text-4xl font-medium leading-none text-brand-gold/50"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4 className="flex items-center gap-2 font-semibold text-ink">
                    {belief.title}
                    {belief.cardinal && (
                      <Star
                        aria-label="Cardinal doctrine"
                        className="size-4 shrink-0 fill-brand-gold text-brand-gold"
                      />
                    )}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {belief.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        eyebrow="Come and See"
        title="Worship with us this week"
        primary={{ label: "Weekly Activities", href: "/activities" }}
        secondary={{ label: "Meet Our Ministers", href: "/ministers" }}
      />
    </>
  );
}
