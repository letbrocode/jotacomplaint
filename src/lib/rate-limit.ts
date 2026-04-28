import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// ============================================
// Rate limiters — sliding window strategy.
// Call .limit(identifier) in API route handlers.
//
// Usage:
//   const { success } = await authLimiter.limit(ip);
//   if (!success) return apiError("RATE_LIMIT_EXCEEDED", ..., 429);
// ============================================

/**
 * Auth endpoints: 5 requests per 60 seconds per IP.
 * Applies to: POST /api/auth/signin, POST /api/auth/signup
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "rl:auth",
  analytics: true,
});

/**
 * Complaint creation: 10 per minute per user.
 * Applies to: POST /api/complaints, createComplaintAction
 */
export const complaintLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "rl:complaint",
  analytics: true,
});

/**
 * General API: 60 requests per minute per user.
 * Applies to all other authenticated API routes.
 */
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "rl:api",
  analytics: true,
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
