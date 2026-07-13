// ============================================
// Job payload type definitions for QStash route handlers
// ============================================

export type EmailJobData =
  | { type: "complaint-created"; complaintId: string; userId: string }
  | { type: "complaint-assigned"; complaintId: string; assignedToId: string }
  | {
      type: "status-updated";
      complaintId: string;
      userId: string;
      newStatus: string;
    }
  | { type: "complaint-resolved"; complaintId: string; userId: string }
  | {
      type: "complaint-rejected";
      complaintId: string;
      userId: string;
      rejectionNote: string;
    };

export type EscalationJobData = { type: "check-sla" };
export type DigestJobData = { type: "weekly-digest" };
export type CleanupJobData = { type: "purge-deleted" };
