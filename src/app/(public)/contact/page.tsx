import type { Metadata } from "next";
import { MapPin, Phone, Mail, Facebook } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";
import { PageHero } from "@/components/public/page-hero";
import { MediaImage } from "@/components/public/media-image";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${CHURCH_INFO.name}. Visit us, call, or send us a message.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Say Hello"
        title="Contact Us"
        description="We would love to hear from you. Reach out to us through any of the channels below."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Contact panel */}
            <div className="flex flex-col rounded-3xl bg-paper p-8 shadow-warm">
              <div className="space-y-7">
                <div className="flex gap-4">
                  <MapPin className="mt-1 size-5 shrink-0 text-gold-deep" />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                      Our Location
                    </h3>
                    <p className="mt-1.5 text-ink">{CHURCH_INFO.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="mt-1 size-5 shrink-0 text-gold-deep" />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                      Phone
                    </h3>
                    <div className="mt-1.5 space-y-1 text-ink">
                      {CHURCH_INFO.phones.map((phone) => (
                        <p key={phone}>{phone}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Mail className="mt-1 size-5 shrink-0 text-gold-deep" />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                      Email
                    </h3>
                    <a
                      href={`mailto:${CHURCH_INFO.email}`}
                      className="mt-1.5 inline-block text-ink transition-colors hover:text-gold-deep"
                    >
                      {CHURCH_INFO.email}
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Facebook className="mt-1 size-5 shrink-0 text-gold-deep" />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                      Facebook
                    </h3>
                    <ul className="mt-1.5 space-y-1 text-ink">
                      {CHURCH_INFO.facebook.map((page) => (
                        <li key={page}>{page}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* The building photo has promo text baked into its lower half;
                  the wide aspect + object-top crop keeps only the clean part. */}
              <MediaImage
                src="/images/sections/church-building.png"
                alt="The AG Wuse church building on Accra Street"
                aspect="wide"
                sizes="(max-width: 1024px) 100vw, 480px"
                className="mt-8 rounded-2xl"
                imgClassName="object-top"
              />
            </div>

            {/* Map */}
            <div className="flex flex-col overflow-hidden rounded-3xl shadow-warm">
              <iframe
                title="AG Wuse Church Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.0!2d7.4833!3d9.0667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s53+Accra+Street+Wuse+Zone+5+Abuja!5e0!3m2!1sen!2sng!4v1234567890"
                width="100%"
                height="100%"
                className="min-h-[400px] flex-1 grayscale-[0.3]"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="bg-brand-navy px-6 py-4">
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-brand-gold">
                    Find us:
                  </span>{" "}
                  {CHURCH_INFO.address}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
