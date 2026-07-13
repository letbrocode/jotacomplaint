import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { subDays } from "date-fns";
import type { CleanupJobData } from "~/server/jobs/types";
import { logger } from "~/lib/logger";

// ============================================
// POST /api/jobs/cleanup
// QStash-delivered soft-delete cleanup job.
// Replaces src/server/jobs/workers/cleanup.worker.ts
// Triggered daily at midnight via QStash schedule.
// Hard-deletes complaints soft-deleted 90+ days ago.
// ============================================

async function handler(_req: NextRequest) {
  const _data = (await _req.json()) as CleanupJobData;

  logger.info("[jobs/cleanup] Running soft-delete purge");

  const cutoff = subDays(new Date(), 90);

  const { count } = await db.complaint.deleteMany({
    where: { deletedAt: { lt: cutoff } },
  });

  logger.info(
    { count, cutoff: cutoff.toISOString() },
    "[jobs/cleanup] Purged soft-deleted complaints",
  );

  return NextResponse.json({ ok: true, purged: count });
}

export const POST = verifySignatureAppRouter(handler);
