import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: {
      findMany: vi.fn().mockResolvedValue([
        { slug: "sample-blog-post", updatedAt: new Date("2026-05-01T00:00:00Z") },
      ]),
    },
    event: {
      findMany: vi.fn().mockResolvedValue([
        { id: "sample-event-id", updatedAt: new Date("2026-05-01T00:00:00Z") },
      ]),
    },
  },
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { ChurchJsonLd, EventJsonLd, BlogPostJsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";

describe("Robots Configuration", () => {
  it("should disallow sensitive routes and point to sitemap.xml", () => {
    const config = robots();
    expect(config.sitemap).toBe(`${SITE_URL}/sitemap.xml`);

    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules.userAgent).toBe("*");
    expect(rules.allow).toBe("/");

    const disallow = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];
    expect(disallow).toContain("/dashboard");
    expect(disallow).toContain("/admin");
    expect(disallow).toContain("/finance");
    expect(disallow).toContain("/profile");
    expect(disallow).toContain("/my-giving");
    expect(disallow).toContain("/api/");
  });
});

describe("Sitemap Configuration", () => {
  it("should include core public pages and exclude auth login/register routes", async () => {
    const routes = await sitemap();
    const urls = routes.map((r) => r.url);

    expect(urls).toContain(`${SITE_URL}`);
    expect(urls).toContain(`${SITE_URL}/about`);
    expect(urls).toContain(`${SITE_URL}/give`);
    expect(urls).toContain(`${SITE_URL}/events`);
    expect(urls).toContain(`${SITE_URL}/blog`);

    // Ensure dynamic routes from DB are included
    expect(urls).toContain(`${SITE_URL}/blog/sample-blog-post`);
    expect(urls).toContain(`${SITE_URL}/events/sample-event-id`);

    // Ensure login and register are excluded from sitemap
    expect(urls).not.toContain(`${SITE_URL}/login`);
    expect(urls).not.toContain(`${SITE_URL}/register`);
  });
});

describe("JSON-LD Schemas", () => {
  it("ChurchJsonLd renders valid schema.org Church metadata", () => {
    const element = ChurchJsonLd({
      churchInfo: {
        name: "Test Church",
        shortName: "TC",
        tagline: "Worship & Word",
        address: "123 Church Way",
        phones: ["+2341234567"],
        email: "test@example.com",
      },
    });

    const json = JSON.parse(element.props.dangerouslySetInnerHTML.__html);
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Church");
    expect(json.name).toBe("Test Church");
    expect(json.alternateName).toBe("TC");
    expect(json.email).toBe("test@example.com");
    expect(json.telephone).toBe("+2341234567");
    expect(json.address.streetAddress).toBe("123 Church Way");
  });

  it("EventJsonLd renders valid schema.org Event metadata", () => {
    const startDate = new Date("2026-10-15T09:00:00Z");
    const endDate = new Date("2026-10-15T12:00:00Z");

    const element = EventJsonLd({
      event: {
        id: "evt-123",
        title: "Annual Convention",
        description: "A gathering of believers",
        startDate,
        endDate,
        location: "Main Sanctuary",
        imageUrl: "https://example.com/banner.jpg",
      },
    });

    const json = JSON.parse(element.props.dangerouslySetInnerHTML.__html);
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Event");
    expect(json.name).toBe("Annual Convention");
    expect(json.startDate).toBe(startDate.toISOString());
    expect(json.endDate).toBe(endDate.toISOString());
    expect(json.location.name).toBe("Main Sanctuary");
    expect(json.image).toEqual(["https://example.com/banner.jpg"]);
  });

  it("BlogPostJsonLd renders valid schema.org BlogPosting metadata", () => {
    const publishedAt = new Date("2026-08-01T10:00:00Z");
    const updatedAt = new Date("2026-08-05T14:00:00Z");

    const element = BlogPostJsonLd({
      post: {
        slug: "walking-in-faith",
        title: "Walking in Faith",
        excerpt: "An encouraging post about faith.",
        publishedAt,
        updatedAt,
        featuredImage: "https://example.com/faith.jpg",
      },
    });

    const json = JSON.parse(element.props.dangerouslySetInnerHTML.__html);
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("BlogPosting");
    expect(json.headline).toBe("Walking in Faith");
    expect(json.description).toBe("An encouraging post about faith.");
    expect(json.datePublished).toBe(publishedAt.toISOString());
    expect(json.dateModified).toBe(updatedAt.toISOString());
    expect(json.mainEntityOfPage["@id"]).toBe(`${SITE_URL}/blog/walking-in-faith`);
  });

  it("escapes markup in JSON-LD so a title cannot close the script element", () => {
    const payload = "</script><script>alert(1)</script> & more";
    const element = BlogPostJsonLd({
      post: { slug: "x", title: payload },
    });

    const html: string = element.props.dangerouslySetInnerHTML.__html;
    expect(html).not.toContain("<");
    expect(html).not.toContain(">");
    // Still valid JSON that round-trips to the original value
    expect(JSON.parse(html).headline).toBe(payload);
  });
});
