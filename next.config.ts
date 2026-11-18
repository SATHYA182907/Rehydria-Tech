import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy (docs/SECURITY_PLAN.md §10).
 *
 * Nonce-based CSP forces every page to render dynamically and is incompatible with the
 * static shell produced by Cache Components / partial prerendering. We therefore use a
 * static policy: scripts are restricted to our origin plus the exact third parties we
 * integrate, with 'unsafe-inline' for Next's inline hydration payloads. The stronger
 * controls (object-src none, base-uri, form-action, frame-ancestors) are kept strict.
 */
const csp = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://checkout.razorpay.com",
    "https://www.google.com/recaptcha/",
    "https://www.gstatic.com/recaptcha/",
    "https://apis.google.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https://firebasestorage.googleapis.com", "https://storage.googleapis.com", "https://*.razorpay.com"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "https://*.cloudfunctions.net",
    "https://api.razorpay.com",
    "https://lumberjack.razorpay.com",
    "https://www.google.com/recaptcha/",
    ...(isDev ? ["ws:", "http://127.0.0.1:*", "http://localhost:*"] : []),
  ],
  "frame-src": [
    "'self'",
    "https://api.razorpay.com",
    "https://checkout.razorpay.com",
    "https://*.firebaseapp.com",
    "https://www.google.com/recaptcha/",
    "https://recaptcha.google.com",
    "https://iframe.mediadelivery.net",
  ],
  "media-src": ["'self'", "blob:"],
  "worker-src": ["'self'", "blob:"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'", "https://api.razorpay.com"],
  "frame-ancestors": ["'none'"],
  ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
} satisfies Record<string, string[]>;

const cspHeader = Object.entries(csp)
  .map(([directive, values]) => [directive, ...values].join(" "))
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Razorpay Checkout needs `payment`; everything sensitive is off.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self \"https://api.razorpay.com\")" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  experimental: {
    // Tree-shake icon and animation packages to only what each route imports.
    optimizePackageImports: ["lucide-react", "radix-ui", "motion", "recharts"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
