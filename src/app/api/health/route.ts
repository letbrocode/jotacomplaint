import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { redis } from "~/lib/redis";
import { ioredis } from "~/lib/ioredis";
import { emailQueue } from "~/server/jobs/queues";
import { logger } from "~/lib/logger";

export async function GET() {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  let isHealthy = true;

  // 1. Database Health
  try {
    await db.$queryRaw`SELECT 1`;
    status.services.database = "UP";
  } catch (err) {
    logger.error({ err }, "Health Check: Database DOWN");
    status.services.database = "DOWN";
    isHealthy = false;
  }

  // 2. Upstash Redis (Cache/Rate Limit)
  try {
    const pong = await redis.ping();
    status.services.redis_cache = pong === "PONG" ? "UP" : "DEGRADED";
    if (pong !== "PONG") {
      logger.warn({ pong }, "Health Check: Upstash Redis DEGRADED");
      isHealthy = false;
    }
  } catch (err) {
    logger.error({ err }, "Health Check: Upstash Redis DOWN");
    status.services.redis_cache = "DOWN";
    isHealthy = false;
  }

  // 3. TCP Redis (BullMQ)
  try {
    const pong = await ioredis.ping();
    status.services.redis_queue = pong === "PONG" ? "UP" : "DEGRADED";
    if (pong !== "PONG") {
      logger.warn({ pong }, "Health Check: TCP Redis DEGRADED");
      isHealthy = false;
    }
  } catch (err) {
    logger.error({ err }, "Health Check: TCP Redis DOWN");
    status.services.redis_queue = "DOWN";
    isHealthy = false;
  }

  // 4. BullMQ Health
  try {
    const counts = await emailQueue.getJobCounts();
    status.services.bullmq = {
      status: "UP",
      queue_depth: counts,
    };
  } catch (err) {
    logger.error({ err }, "Health Check: BullMQ DOWN");
    status.services.bullmq = "DOWN";
    isHealthy = false;
  }

  if (!isHealthy) {
    logger.warn(status, "Health Check FAILED");
  }

  return NextResponse.json(status, {
    status: isHealthy ? 200 : 503,
  });
}
