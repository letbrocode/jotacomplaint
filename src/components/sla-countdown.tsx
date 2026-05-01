"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "~/lib/utils";

// ============================================
// SLA Countdown — shows time remaining or
// overdue duration relative to dueDate.
// Updates every minute client-side.
// ============================================

interface SlaCountdownProps {
  dueDate: Date | string | null | undefined;
  status: string;
  className?: string;
}

function formatDuration(ms: number): string {
  const totalMins = Math.floor(Math.abs(ms) / 60000);
  if (totalMins < 60) return `${totalMins}m`;
  const hrs = Math.floor(totalMins / 60);
  if (hrs < 24) return `${hrs}h ${totalMins % 60}m`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs > 0 ? `${days}d ${remHrs}h` : `${days}d`;
}

export function SlaCountdown({ dueDate, status, className }: SlaCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Only tick if complaint is still open
    if (status === "RESOLVED" || status === "REJECTED" || !dueDate) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [status, dueDate]);

  if (!dueDate) return null;

  // Closed complaints — don't show SLA countdown
  if (status === "RESOLVED" || status === "REJECTED") return null;

  const due = new Date(dueDate).getTime();
  const diff = due - now; // positive = time remaining, negative = overdue
  const isOverdue = diff < 0;
  const isCritical = !isOverdue && diff < 2 * 60 * 60 * 1000; // < 2h remaining

  if (isOverdue) {
    return (
      <span
        className={cn(
          "flex items-center gap-1 font-medium text-red-600",
          className,
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Overdue by {formatDuration(diff)}
      </span>
    );
  }

  if (isCritical) {
    return (
      <span
        className={cn(
          "flex items-center gap-1 font-medium text-orange-600",
          className,
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0 animate-pulse" />
        Due in {formatDuration(diff)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-1",
        className,
      )}
    >
      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
      Due in {formatDuration(diff)}
    </span>
  );
}
