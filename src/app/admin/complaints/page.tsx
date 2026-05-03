import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import {
  getComplaintStatusCountsForRole,
  getComplaintsForRole,
} from "~/server/services/complaint.service";
import { getAllDepartments } from "~/server/services/department.service";
import { getStaffMembers } from "~/server/services/user.service";
import { ComplaintsFilters } from "~/components/complaints-filters";
import ComplaintCard from "~/components/complaint-card";
import { Status, Priority, ComplaintCategory } from "@prisma/client";
import { Button } from "~/components/ui/button";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    category?: string;
    departmentId?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminComplaintsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const params = await searchParams;

  // Validate and parse filters
  const filters = {
    status: Object.values(Status).includes(params.status as Status)
      ? (params.status as Status)
      : undefined,
    priority: Object.values(Priority).includes(params.priority as Priority)
      ? (params.priority as Priority)
      : undefined,
    category: Object.values(ComplaintCategory).includes(
      params.category as ComplaintCategory,
    )
      ? (params.category as ComplaintCategory)
      : undefined,
    departmentId: params.departmentId
      ? Number.parseInt(params.departmentId)
      : undefined,
    search: params.search,
  };

  // Fetch data in parallel
  const [complaintsData, stats, departments, staffList] = await Promise.all([
    getComplaintsForRole(session.user.id!, "ADMIN", filters, {
      take: 50,
    }),
    getComplaintStatusCountsForRole(session.user.id!, "ADMIN", filters),
    getAllDepartments(),
    getStaffMembers(),
  ]);

  const { data: complaints, total } = complaintsData;

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Complaints</h1>
          <p className="text-muted-foreground">
            View and manage all complaints registered by users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/complaints">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Filtered Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium text-yellow-600">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium text-blue-600">In Progress</p>
          <p className="text-2xl font-bold">{stats.inProgress}</p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium text-green-600">Resolved</p>
          <p className="text-2xl font-bold">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ComplaintsFilters departments={departments} />
      </Suspense>

      {/* Results Count */}
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-muted-foreground text-sm">
          Showing {complaints.length} of {total} complaints
        </p>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No complaints found matching your filters.
          </p>
          <Button variant="link" asChild>
            <Link href="/admin/complaints">Clear all filters</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint as any}
              staffList={staffList as any}
              detailHref={`/admin/complaints/${complaint.id}`}
              canUpdateStatus
              canAssignStaff
            />
          ))}
        </div>
      )}
    </div>
  );
}
