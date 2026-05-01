import { emailQueue, escalationQueue, digestQueue, cleanupQueue } from "./queues";

// ============================================
// BullMQ Cron Scheduler
// Call startScheduler() from the worker entrypoint.
// ============================================

export async function startScheduler() {
  // SLA escalation — every 15 minutes
  await escalationQueue.upsertJobScheduler(
    "sla-check-cron",
    { pattern: "*/15 * * * *" },
    {
      name: "check-sla",
      data: { type: "check-sla" },
    },
  );

  // Weekly digest — every Monday at 9am
  await digestQueue.upsertJobScheduler(
    "weekly-digest-cron",
    { pattern: "0 9 * * 1" },
    {
      name: "weekly-digest",
      data: { type: "weekly-digest" },
    },
  );

  // Cleanup soft-deleted — every day at midnight
  await cleanupQueue.upsertJobScheduler(
    "cleanup-cron",
    { pattern: "0 0 * * *" },
    {
      name: "purge-deleted",
      data: { type: "purge-deleted" },
    },
  );

  console.log("✅ BullMQ cron schedulers started");
}
