import type { NextConfig } from "next";
import { ALLOWED_IMAGE_HOSTS } from "./src/lib/media-hosts";
import { getSecurityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: getSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
