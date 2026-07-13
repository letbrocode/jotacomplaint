import { Redis } from "@upstash/redis";

// ============================================
// Upstash Redis client (HTTP-based, serverless-safe)
// Used for: rate limiting, metric caching
// ============================================

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error(
    "Missing Upstash Redis env vars: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
  );
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
