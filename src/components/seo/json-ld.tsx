import type { ChurchInfo } from "@/lib/settings/schema";
import { SITE_URL } from "@/lib/site";
import { serializeJsonLd } from "@/lib/json-ld";

export function ChurchJsonLd({ churchInfo }: { churchInfo?: Partial<ChurchInfo> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: churchInfo?.name || "Assemblies of God Church, Wuse Zone 5",
    alternateName: churchInfo?.shortName || "AG Wuse",
    url: SITE_URL,
    logo: `${SITE_URL}/ag-logo.png`,
    image: `${SITE_URL}/ag-logo.png`,
    description: churchInfo?.tagline || "Center of Love and Worship",
    address: {
      "@type": "PostalAddress",
      streetAddress: churchInfo?.address || "53, Accra Street, Wuse Zone 5",
      addressLocality: "Abuja",
      addressRegion: "FCT",
      addressCountry: "NG",
    },
    telephone: churchInfo?.phones?.[0] || "+2348035910333",
    email: churchInfo?.email || "info@agwuse.org",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

export function EventJsonLd({
  event,
  address,
}: {
  /** Church street address from settings (defaults to the seeded address). */
  address?: string;
  event: {
    id: string;
    title: string;
    description?: string | null;
    startDate: Date;
    endDate?: Date | null;
    location?: string | null;
    imageUrl?: string | null;
  };
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    startDate: new Date(event.startDate).toISOString(),
    endDate: event.endDate ? new Date(event.endDate).toISOString() : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location || "Assemblies of God Church, Wuse Zone 5",
      address: {
        "@type": "PostalAddress",
        streetAddress: address || "53 Accra Street, Wuse Zone 5",
        addressLocality: "Abuja",
        addressRegion: "FCT",
        addressCountry: "NG",
      },
    },
    image: event.imageUrl ? [event.imageUrl] : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

export function BlogPostJsonLd({
  post,
}: {
  post: {
    title: string;
    excerpt?: string | null;
    publishedAt?: Date | null;
    updatedAt?: Date;
    featuredImage?: string | null;
    slug: string;
  };
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "AG Wuse",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/ag-logo.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}
