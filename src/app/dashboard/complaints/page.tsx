import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { getComplaintsForRole } from "~/server/services/complaint.service";
import { getAllDepartments } from "~/server/services/department.service";
import { ComplaintsFilters } from "~/components/complaints-filters";
import ComplaintCard from "~/components/complaint-card";
import { Status, Priority, ComplaintCategory } from "@prisma/client";
import { Button } from "~/components/ui/button";
import { RefreshCw, Plus, FileText } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

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

export default async function UserComplaintsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "USER") {
    redirect("/signin");
  }

  const params = await searchParams;

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
    search: params.search,
  };

  const [complaintsData, departments] = await Promise.all([
    getComplaintsForRole(session.user.id!, "USER", filters, { take: 50 }),
    getAllDepartments(),
  ]);

  const { data: complaints, total } = complaintsData;

  const stats = {
    total: total,
    pending: complaints.filter((c) => c.status === "PENDING").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Complaints</h2>
          <p className="text-muted-foreground">
            View and track all your submitted complaints
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/complaints">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/register">
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Total</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge className="bg-yellow-500">{stats.pending}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Badge className="bg-blue-500">{stats.inProgress}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Badge className="bg-green-500">{stats.resolved}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ComplaintsFilters
          showDepartmentFilter={false}
          statusOptions={["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"]}
        />
      </Suspense>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {complaints.length} of {total} complaints
        </p>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-20" />
          <h3 className="mb-2 text-lg font-semibold">
            No complaints found
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Try adjusting your filters or submit a new complaint.
          </p>
          <Button asChild>
            <Link href="/dashboard/register">
              <Plus className="mr-2 h-4 w-4" />
              Submit Complaint
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint as any}
              detailHref={`/dashboard/complaints/${complaint.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
