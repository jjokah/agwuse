import type { NextConfig } from "next";
import { REMOTE_IMAGE_PATTERNS } from "./src/lib/media-hosts";
import { getSecurityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: REMOTE_IMAGE_PATTERNS,
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
