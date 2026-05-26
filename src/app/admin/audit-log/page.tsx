import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { getAuditLog } from "~/server/services/audit.service";
import type { ActivityAction } from "@prisma/client";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Audit Log | JotaComplaint Admin",
  description: "View all complaint activity and admin action records",
};

const ACTION_LABELS: Record<ActivityAction, string> = {
  NEW_COMPLAINT: "Submitted",
  STATUS_CHANGED: "Status Changed",
  ASSIGNED: "Assigned",
  REASSIGNED: "Reassigned",
  COMMENT_ADDED: "Comment Added",
  PRIORITY_CHANGED: "Priority Changed",
  DEPARTMENT_CHANGED: "Dept Changed",
  REJECTED: "Rejected",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  MARKED_DUPLICATE: "Marked Duplicate",
};

const ACTION_COLORS: Record<ActivityAction, string> = {
  NEW_COMPLAINT: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  STATUS_CHANGED: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  ASSIGNED: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  REASSIGNED: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  COMMENT_ADDED: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  PRIORITY_CHANGED: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  DEPARTMENT_CHANGED: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  REJECTED: "bg-red-500/15 text-red-700 dark:text-red-300",
  ESCALATED: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  RESOLVED: "bg-green-500/15 text-green-700 dark:text-green-300",
  MARKED_DUPLICATE: "bg-gray-500/15 text-gray-700 dark:text-gray-300",
};

interface PageProps {
  searchParams: Promise<{ page?: string; action?: string; complaintId?: string }>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/signin");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1"));
  const action = params.action as ActivityAction | undefined;
  const complaintId = params.complaintId;

  const { entries, total, totalPages } = await getAuditLog({
    action,
    complaintId,
    page,
    pageSize: 25,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} total activity records across all complaints
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-muted-foreground">Filter by action:</span>
        <Link
          href="/admin/audit-log"
          className={`rounded-full px-3 py-0.5 font-medium transition-colors ${
            !action
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </Link>
        {(Object.keys(ACTION_LABELS) as ActivityAction[]).map((a) => (
          <Link
            key={a}
            href={`/admin/audit-log?action=${a}`}
            className={`rounded-full px-3 py-0.5 font-medium transition-colors ${
              action === a
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            data-testid={`filter-action-${a.toLowerCase()}`}
          >
            {ACTION_LABELS[a]}
          </Link>
        ))}
      </div>

      {/* Active filter badge */}
      {complaintId && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Showing entries for complaint:</span>
          <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{complaintId}</code>
          <Link
            href="/admin/audit-log"
            className="text-destructive hover:underline"
          >
            Clear
          </Link>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Activity Records</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} — showing {entries.length} of {total} records
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShieldCheck className="mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">No activity records found</p>
              <p className="text-sm">Try removing filters to see all records</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="audit-log-table">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Complaint</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Change</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid="audit-log-row"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACTION_COLORS[entry.action]}`}
                        >
                          {ACTION_LABELS[entry.action]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/complaints/${entry.complaintId}`}
                          className="font-medium hover:underline text-foreground"
                        >
                          {entry.complaint.title.length > 40
                            ? `${entry.complaint.title.slice(0, 40)}…`
                            : entry.complaint.title}
                        </Link>
                        <div className="mt-0.5">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {entry.complaint.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{entry.user.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{entry.user.role}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {entry.oldValue && entry.newValue ? (
                          <span>
                            <span className="line-through opacity-60">{entry.oldValue}</span>
                            {" → "}
                            <span className="text-foreground font-semibold">{entry.newValue}</span>
                          </span>
                        ) : entry.comment ? (
                          <span className="italic not-italic font-sans normal-case">
                            {entry.comment.length > 60
                              ? `${entry.comment.slice(0, 60)}…`
                              : entry.comment}
                          </span>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/audit-log?page=${page - 1}${action ? `&action=${action}` : ""}${complaintId ? `&complaintId=${complaintId}` : ""}`}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                data-testid="audit-log-prev"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/audit-log?page=${page + 1}${action ? `&action=${action}` : ""}${complaintId ? `&complaintId=${complaintId}` : ""}`}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                data-testid="audit-log-next"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
