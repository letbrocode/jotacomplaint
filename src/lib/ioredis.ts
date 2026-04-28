import IORedis from "ioredis";

// ============================================
// IORedis client — TCP-based Redis connection
// Used exclusively for BullMQ job queues.
// Upstash HTTP client cannot be used with BullMQ.
//
// For local dev: run `docker run -p 6379:6379 redis`
// For production: Railway or Render Redis
// ============================================

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Singleton pattern — reuse connection across hot reloads
const globalForRedis = globalThis as unknown as {
  ioredis: IORedis | undefined;
};

export const ioredis =
  globalForRedis.ioredis ??
  new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.ioredis = ioredis;
}
