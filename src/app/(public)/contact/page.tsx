import type { Metadata } from "next";
import { MapPin, Phone, Mail } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${CHURCH_INFO.name}. Visit us, call, or send us a message.`,
};

export default function ContactPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            We would love to hear from you. Reach out to us through any of the
            channels below.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Details */}
          <div className="space-y-6">
            <div className="flex gap-4 rounded-lg border bg-card p-6">
              <MapPin className="mt-1 size-5 shrink-0 text-brand-gold" />
              <div>
                <h3 className="font-semibold">Our Location</h3>
                <p className="text-muted-foreground">{CHURCH_INFO.address}</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border bg-card p-6">
              <Phone className="mt-1 size-5 shrink-0 text-brand-gold" />
              <div>
                <h3 className="font-semibold">Phone</h3>
                <div className="space-y-1 text-muted-foreground">
                  {CHURCH_INFO.phones.map((phone) => (
                    <p key={phone}>{phone}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border bg-card p-6">
              <Mail className="mt-1 size-5 shrink-0 text-brand-gold" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <a
                  href={`mailto:${CHURCH_INFO.email}`}
                  className="text-brand-gold-dark hover:underline"
                >
                  {CHURCH_INFO.email}
                </a>
              </div>
            </div>

            {/* Social */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-2 font-semibold">Follow Us on Facebook</h3>
              <ul className="space-y-1 text-muted-foreground">
                {CHURCH_INFO.facebook.map((page) => (
                  <li key={page}>{page}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Map Embed */}
          <div className="overflow-hidden rounded-lg border">
            <iframe
              title="AG Wuse Church Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.0!2d7.4833!3d9.0667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s53+Accra+Street+Wuse+Zone+5+Abuja!5e0!3m2!1sen!2sng!4v1234567890"
              width="100%"
              height="100%"
              className="min-h-[400px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
