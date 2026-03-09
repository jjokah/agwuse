import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://agwuse.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/finance", "/profile", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
