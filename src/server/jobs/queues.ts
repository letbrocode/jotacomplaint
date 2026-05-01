import { Queue } from "bullmq";
import { ioredis } from "~/lib/ioredis";

// ============================================
// BullMQ Queue definitions
// All queues share the same IORedis connection.
// Workers are in separate files under /workers.
// ============================================

const connection = ioredis;

/** Email delivery queue — confirmation, assignment, status updates */
export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

/** SLA escalation checks — run every 15 minutes via cron */
export const escalationQueue = new Queue("escalation", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: { count: 20 },
  },
});

/** Weekly admin digest emails */
export const digestQueue = new Queue("digest", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: { count: 10 },
  },
});

/** Soft-delete cleanup — purge complaints deleted 90+ days ago */
export const cleanupQueue = new Queue("cleanup", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: { count: 5 },
  },
});

// ============================================
// Job type definitions (payload shapes)
// ============================================

export type EmailJobData =
  | { type: "complaint-created"; complaintId: string; userId: string }
  | { type: "complaint-assigned"; complaintId: string; assignedToId: string }
  | { type: "status-updated"; complaintId: string; userId: string; newStatus: string }
  | { type: "complaint-resolved"; complaintId: string; userId: string }
  | { type: "complaint-rejected"; complaintId: string; userId: string; rejectionNote: string };

export type EscalationJobData = { type: "check-sla" };
export type DigestJobData = { type: "weekly-digest" };
export type CleanupJobData = { type: "purge-deleted" };
