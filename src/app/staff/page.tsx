import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
} from "lucide-react";
import Link from "next/link";

export default async function StaffDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STAFF") {
    redirect("/signin");
  }

  // Get staff statistics
  const assignedComplaints = await db.complaint.findMany({
    where: {
      assignedToId: session.user.id,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  const stats = {
    total: assignedComplaints.length,
    pending: assignedComplaints.filter((c) => c.status === "PENDING").length,
    inProgress: assignedComplaints.filter((c) => c.status === "IN_PROGRESS")
      .length,
    resolved: await db.complaint.count({
      where: {
        assignedToId: session.user.id,
        status: "RESOLVED",
      },
    }),
  };

  return (
    <div className="space-y-6 p-5">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name}!
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your assigned complaints
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Complaints
            </CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">
              Currently assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {stats.pending}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.inProgress}
            </div>
            <p className="text-muted-foreground text-xs">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.resolved}
            </div>
            <p className="text-muted-foreground text-xs">Total completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and navigation</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="w-full justify-start">
              <Link href="/staff/complaints">
                <AlertCircle className="mr-2 h-4 w-4" />
                View All Assignments
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/staff/complaints?status=PENDING">
                <Clock className="mr-2 h-4 w-4" />
                Pending Complaints
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/staff/map">
                <MapPin className="mr-2 h-4 w-4" />
                Map View
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Your latest complaints</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedComplaints.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No complaints assigned yet
              </p>
            ) : (
              <div className="space-y-3">
                {assignedComplaints.slice(0, 3).map((complaint) => (
                  <Link
                    key={complaint.id}
                    href={`/staff/complaints/${complaint.id}`}
                    className="hover:bg-muted/50 block rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {complaint.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {complaint.user.name}
                        </p>
                      </div>
                      <Badge
                        variant={
                          complaint.priority === "HIGH"
                            ? "destructive"
                            : complaint.priority === "MEDIUM"
                              ? "warning"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {complaint.priority}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {assignedComplaints.length > 3 && (
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/staff/complaints">
                      View All ({assignedComplaints.length})
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
