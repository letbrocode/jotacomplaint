import { redis } from "./redis";

// ============================================
// Cache helpers — thin wrappers around Upstash Redis.
// Use for expensive server-side queries (analytics,
// dashboard stats) that don't need to be real-time.
// ============================================

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Get a cached value or compute + store it.
 *
 * @example
 * const stats = await getCached("dashboard:stats", () => getDashboardStats(), 3600);
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
}

/**
 * Manually invalidate one or more cache keys.
 * Call this after mutations that affect cached data.
 *
 * @example
 * await invalidateCache("dashboard:stats", "analytics:trend");
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redis.del(...keys);
}

/**
 * Invalidate all keys matching a pattern prefix.
 * Use sparingly — scans the keyspace.
 *
 * @example
 * await invalidateCachePattern("analytics:*");
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}

// ============================================
// Named cache keys — keep them in one place
// so a typo doesn't create ghost cache entries.
// ============================================

export const CacheKeys = {
  dashboardStats: "dashboard:stats",
  trendData: (days: number) => `analytics:trend:${days}`,
  departmentBreakdown: "analytics:departments",
  publicStats: "public:stats",
} as const;
