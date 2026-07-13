/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

// Derive the exact S3 virtual-hosted endpoint from env vars so the CSP is
// precise. CSP only honours a wildcard (*) as the leftmost hostname label;
// patterns like *.s3.*.amazonaws.com silently fail for deeper sub-domains.
//
// Virtual-hosted S3 URL shape:
//   https://{bucket}.s3.{region}.amazonaws.com/{key}
const s3Hostname =
  process.env.S3_UPLOAD_BUCKET && process.env.AWS_REGION
    ? `${process.env.S3_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
    : null;

// Whitespace-normalised CSP string — kept inline so the full policy is
// immediately readable.  The template is split over multiple lines for
// readability; the `.replace(/\s{2,}/g, " ").trim()` call collapses it.
const buildCsp = () => {
  const s3Origin = s3Hostname ? `https://${s3Hostname}` : "";

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${s3Origin} https://*.tile.openstreetmap.org`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    [
      "connect-src 'self'",
      "https://*.upstash.io",
      s3Origin,
    ]
      .filter(Boolean)
      .join(" "),
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();
};

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      // Only register the S3 pattern when the bucket is configured.
      // Next.js hostname patterns match exactly — no need for wildcards.
      ...(s3Hostname
        ? [{ protocol: /** @type {"https"} */ ("https"), hostname: s3Hostname }]
        : []),
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildCsp(),
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default config;
