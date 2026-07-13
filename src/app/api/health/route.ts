import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { redis } from "~/lib/redis";
import { qstashClient } from "~/lib/qstash";
import { logger } from "~/lib/logger";

export async function GET() {
  const status: {
    timestamp: string;
    uptime: number;
    services: Record<string, unknown>;
  } = {
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

  // 3. QStash (background jobs) — lightweight reachability check (2s timeout)
  try {
    const schedules = await Promise.race([
      qstashClient.schedules.list(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("QStash ping timeout")), 2000),
      ),
    ]);

    // If we can list schedules (even empty), the API is reachable
    status.services.qstash = {
      status: "UP",
      schedule_count: schedules.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("timeout")) {
      logger.warn("Health Check: QStash ping timed out (>2s)");
      status.services.qstash = "DEGRADED";
    } else {
      logger.error({ err }, "Health Check: QStash DOWN");
      status.services.qstash = "DOWN";
      isHealthy = false;
    }
  }

  if (!isHealthy) {
    logger.warn(status, "Health Check FAILED");
  }

  return NextResponse.json(status, {
    status: isHealthy ? 200 : 503,
  });
}
