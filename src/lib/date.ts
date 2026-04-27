import { formatDistanceToNow, format, differenceInHours, addHours } from "date-fns";

// ============================================
// Date formatting helpers
// ============================================

/**
 * "2 hours ago", "3 days ago", etc.
 */
export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * "Jan 12, 2026"
 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

/**
 * "Jan 12, 2026 at 3:45 PM"
 */
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

/**
 * Compute SLA due date from creation time + resolution hours.
 */
export function getSLADueDate(createdAt: Date | string, resolutionHrs: number): Date {
  return addHours(new Date(createdAt), resolutionHrs);
}

/**
 * Returns the SLA status label + colour variant based on how much time is left.
 */
export function getSLAStatus(dueDate: Date | string | null): {
  label: string;
  variant: "success" | "warning" | "danger" | "neutral";
} {
  if (!dueDate) return { label: "No SLA", variant: "neutral" };

  const hoursLeft = differenceInHours(new Date(dueDate), new Date());

  if (hoursLeft < 0) return { label: "Breached", variant: "danger" };
  if (hoursLeft < 2) return { label: `${hoursLeft}h left`, variant: "danger" };
  if (hoursLeft < 6) return { label: `${hoursLeft}h left`, variant: "warning" };
  return { label: `${hoursLeft}h left`, variant: "success" };
}

/**
 * How long a complaint took to resolve in human-readable form.
 */
export function getResolutionTime(
  createdAt: Date | string,
  resolvedAt: Date | string | null,
): string {
  if (!resolvedAt) return "Unresolved";
  const hours = differenceInHours(new Date(resolvedAt), new Date(createdAt));
  if (hours < 1) return "< 1 hour";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
