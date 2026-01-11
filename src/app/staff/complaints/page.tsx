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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { MapPin, Navigation, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function StaffComplaintsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STAFF") {
    redirect("/signin");
  }

  // Get complaints assigned to this staff member
  const assignedComplaints = await db.complaint.findMany({
    where: {
      assignedToId: session.user.id,
      status: {
        in: ["PENDING", "IN_PROGRESS"],
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  const stats = {
    total: assignedComplaints.length,
    pending: assignedComplaints.filter((c) => c.status === "PENDING").length,
    inProgress: assignedComplaints.filter((c) => c.status === "IN_PROGRESS")
      .length,
    withLocation: assignedComplaints.filter(
      (c) => c.latitude !== null && c.longitude !== null,
    ).length,
  };

  const priorityColors = {
    HIGH: "destructive",
    MEDIUM: "warning",
    LOW: "secondary",
  } as const;

  const statusColors = {
    PENDING: "bg-amber-500",
    IN_PROGRESS: "bg-blue-500",
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Assignments</h2>
        <p className="text-muted-foreground">
          Complaints assigned to you that require attention
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Assigned</CardDescription>
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

      {/* Complaints List */}
      <div className="space-y-4">
        {assignedComplaints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No Assigned Complaints</h3>
              <p className="text-muted-foreground text-sm">
                You don&apos;t have any active assignments at the moment
              </p>
            </CardContent>
          </Card>
        ) : (
          assignedComplaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {complaint.title}
                      </h3>
                      <Badge
                        variant={
                          priorityColors[
                            complaint.priority as keyof typeof priorityColors
                          ]
                        }
                      >
                        {complaint.priority}
                      </Badge>
                      <Badge
                        className={
                          statusColors[
                            complaint.status as keyof typeof statusColors
                          ]
                        }
                        variant="secondary"
                      >
                        {complaint.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {complaint.details}
                    </p>

                    <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </div>
                      {complaint.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {complaint.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Reported by:</span>
                        {complaint.user.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button asChild>
                      <Link href={`/staff/complaints/${complaint.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {complaint.latitude && complaint.longitude && (
                      <Button variant="outline" asChild>
                        <Link
                          href={`/staff/complaints/${complaint.id}/navigate`}
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          Navigate
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
