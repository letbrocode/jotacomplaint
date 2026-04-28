import { Worker } from "bullmq";
import { ioredis } from "~/lib/ioredis";
import { db } from "~/server/db";
import { subDays } from "date-fns";
import type { CleanupJobData } from "../queues";

// ============================================
// Cleanup Worker — Purge soft-deleted complaints
// Runs daily at midnight.
// Hard-deletes complaints soft-deleted 90+ days ago.
// ============================================

export const cleanupWorker = new Worker<CleanupJobData>(
  "cleanup",
  async () => {
    const cutoff = subDays(new Date(), 90);

    const { count } = await db.complaint.deleteMany({
      where: { deletedAt: { lt: cutoff } },
    });

    console.log(`[cleanup-worker] Purged ${count} complaints deleted before ${cutoff.toISOString()}`);
  },
  { connection: ioredis },
);

cleanupWorker.on("failed", (job, err) => {
  console.error(`[cleanup-worker] Job ${job?.id} failed:`, err.message);
});
