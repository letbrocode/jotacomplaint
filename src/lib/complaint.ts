import type { ComplaintCategory, Priority, Status } from "@prisma/client";

// ============================================
// Complaint display helpers — keep UI in sync
// with all status/priority/category values
// ============================================

export function getStatusLabel(status: Status): string {
  const map: Record<Status, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    REJECTED: "Rejected",
    ESCALATED: "Escalated",
  };
  return map[status];
}

export function getStatusColor(status: Status): string {
  const map: Record<Status, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    RESOLVED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    ESCALATED: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  };
  return map[status];
}

export function getPriorityColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    HIGH: "text-red-600 dark:text-red-400",
    MEDIUM: "text-amber-600 dark:text-amber-400",
    LOW: "text-blue-600 dark:text-blue-400",
  };
  return map[priority];
}

export function getPriorityBadgeColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    LOW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  };
  return map[priority];
}

export function getCategoryLabel(category: ComplaintCategory): string {
  const map: Record<ComplaintCategory, string> = {
    ROADS: "Roads & Infrastructure",
    WATER: "Water Supply",
    ELECTRICITY: "Electricity",
    SANITATION: "Sanitation",
    OTHER: "Other",
  };
  return map[category];
}

/** Default SLA hours by priority (used when no SLAPolicy record exists) */
export const DEFAULT_SLA_HOURS: Record<Priority, number> = {
  HIGH: 4,
  MEDIUM: 24,
  LOW: 72,
};
