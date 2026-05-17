import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// ============================================
// Rate limiters — sliding window strategy.
// Call .limit(identifier) in API route handlers.
//
// ephemeralCache: in-process Map used as fallback when
// Upstash is unreachable (CI fake URL, Redis blip, etc.)
// so requests are never blocked due to a Redis outage.
//
// timeout: abort Upstash call after 2s and fall back to
// ephemeralCache — prevents hanging requests.
//
// Usage:
//   const { success } = await authLimiter.limit(ip);
//   if (!success) return apiError("RATE_LIMIT_EXCEEDED", ..., 429);
// ============================================

const ephemeralCache = new Map<string, number>();

/**
 * Auth endpoints: 5 requests per 60 seconds per IP.
 * Applies to: POST /api/auth/signin, POST /api/auth/signup
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "rl:auth",
  analytics: false,
  ephemeralCache,
  timeout: 2000,
});

/**
 * Complaint creation: 10 per minute per user.
 * Applies to: POST /api/complaints, createComplaintAction
 */
export const complaintLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "rl:complaint",
  analytics: false,
  ephemeralCache,
  timeout: 2000,
});

/**
 * General API: 60 requests per minute per user.
 * Applies to all other authenticated API routes.
 */
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "rl:api",
  analytics: false,
  ephemeralCache,
  timeout: 2000,
});

/**
 * Helper — get the real IP from Next.js request headers.
 */
export function getIpFromRequest(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/**
 * Helper for Server Actions to get IP.
 */
export async function getIp(headersList: Headers): Promise<string> {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "anonymous"
  );
}
