/**
 * Builds Content Security Policy (CSP) header string.
 *
 * Rules:
 * - 'unsafe-eval' enabled only in development mode.
 * - object-src 'none', base-uri 'self', form-action 'self', frame-ancestors 'none'.
 * - frame-src permits Paystack checkout, YouTube (including youtube-nocookie), Facebook, and Google Maps.
 * - connect-src permits Paystack API and Vercel Blob.
 */
export function buildCsp(options: { isDev?: boolean } = {}): string {
  const isDev = options.isDev ?? process.env.NODE_ENV !== "production";

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://js.paystack.co",
  ];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https://api.paystack.co",
      "https://*.blob.vercel-storage.com",
    ],
    "frame-src": [
      "'self'",
      "https://checkout.paystack.com",
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      "https://www.facebook.com",
      "https://web.facebook.com",
      "https://www.google.com",
    ],
    "media-src": ["'self'", "https:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}

/**
 * Returns security headers including CSP and HSTS (in production).
 */
export function getSecurityHeaders(isDev?: boolean): Array<{ key: string; value: string }> {
  const dev = isDev ?? process.env.NODE_ENV !== "production";
  const headers = [
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    {
      key: "Content-Security-Policy",
      value: buildCsp({ isDev: dev }),
    },
  ];

  if (!dev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
