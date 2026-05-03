import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { getComplaintsForRole } from "~/server/services/complaint.service";
import { getAllDepartments } from "~/server/services/department.service";
import { ComplaintsFilters } from "~/components/complaints-filters";
import ComplaintCard from "~/components/complaint-card";
import { Status, Priority, ComplaintCategory } from "@prisma/client";
import { Button } from "~/components/ui/button";
import { RefreshCw, MapPin, Navigation, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function StaffComplaintsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "STAFF") {
    redirect("/signin");
  }

  const params = await searchParams;

  // Default to PENDING and IN_PROGRESS if no status filter provided for staff
  const statusFilter = params.status
    ? (params.status as Status)
    : undefined;

  const filters = {
    status: statusFilter,
    priority: Object.values(Priority).includes(params.priority as Priority)
      ? (params.priority as Priority)
      : undefined,
    category: Object.values(ComplaintCategory).includes(
      params.category as ComplaintCategory,
    )
      ? (params.category as ComplaintCategory)
      : undefined,
    search: params.search,
    assignedToId: session.user.id, // Only show assigned to them
  };

  const [complaintsData, departments] = await Promise.all([
    getComplaintsForRole(session.user.id!, "STAFF", filters, { take: 50 }),
    getAllDepartments(),
  ]);

  const { data: complaints, total } = complaintsData;

  const stats = {
    total: total,
    pending: complaints.filter((c) => c.status === "PENDING").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    withLocation: complaints.filter(
      (c) => c.latitude !== null && c.longitude !== null,
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Assignments</h2>
          <p className="text-muted-foreground">
            Complaints assigned to you that require attention
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/staff/complaints">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Filtered Assigned</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-amber-500">
              {stats.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-500">
              {stats.inProgress}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>With Location</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {stats.withLocation}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ComplaintsFilters
          showDepartmentFilter={false}
          statusOptions={["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED", "ESCALATED"]}
        />
      </Suspense>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {complaints.length} of {total} assigned complaints
        </p>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No Complaints Found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your filters or check back later for new assignments
              </p>
            </CardContent>
          </Card>
        ) : (
          complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint as any}
              detailHref={`/staff/complaints/${complaint.id}`}
              canUpdateStatus
            />
          ))
        )}
      </div>
    </div>
  );
}
