import { auth } from "~/server/auth";
import { redirect, notFound } from "next/navigation";
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
import { ArrowLeft, Navigation, MapPin, Calendar, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import UpdateStatusForm from "./UpdateStatusForm";
import AddCommentForm from "./AddCommentForm";

export default async function StaffComplaintDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "STAFF") {
    redirect("/signin");
  }

  const complaint = await db.complaint.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedTo: {
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
      comments: {
        include: {
          author: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      activities: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!complaint) {
    notFound();
  }

  // Check if this staff member is assigned to this complaint
  if (complaint.assignedToId !== session.user.id) {
    redirect("/staff/complaints");
  }

  const hasLocation = complaint.latitude && complaint.longitude;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/staff/complaints">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Complaint Details
            </h2>
            <p className="text-muted-foreground">
              ID: {complaint.id.substring(0, 8)}
            </p>
          </div>
        </div>

        {hasLocation && (
          <Button asChild>
            <Link href={`/staff/complaints/${complaint.id}/navigate`}>
              <Navigation className="mr-2 h-4 w-4" />
              Start Navigation
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Complaint Details */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{complaint.title}</CardTitle>
                <Badge
                  variant={
                    complaint.priority === "HIGH"
                      ? "destructive"
                      : complaint.priority === "MEDIUM"
                        ? "default"
                        : "secondary"
                  }
                >
                  {complaint.priority}
                </Badge>
                <Badge
                  className={
                    complaint.status === "PENDING"
                      ? "bg-amber-500"
                      : complaint.status === "IN_PROGRESS"
                        ? "bg-blue-500"
                        : "bg-green-500"
                  }
                >
                  {complaint.status.replace("_", " ")}
                </Badge>
              </div>
              <CardDescription>
                Category: {complaint.category.replace("_", " ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Description</h4>
                <p className="text-muted-foreground text-sm">
                  {complaint.details}
                </p>
              </div>

              {complaint.location && (
                <div>
                  <h4 className="mb-2 font-semibold">Location</h4>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {complaint.location}
                  </div>
                  {hasLocation && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Coordinates: {complaint.latitude?.toFixed(6)},{" "}
                      {complaint.longitude?.toFixed(6)}
                    </p>
                  )}
                </div>
              )}

              {complaint.photoUrl && (
                <div>
                  <h4 className="mb-2 font-semibold">Photo Evidence</h4>
                  <div className="relative h-64 w-full overflow-hidden rounded-lg border">
                    <Image
                      src={complaint.photoUrl}
                      alt="Complaint photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>
                Change the complaint status or add internal notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpdateStatusForm
                complaintId={complaint.id}
                currentStatus={complaint.status}
              />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>
                Communication history with the citizen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddCommentForm complaintId={complaint.id} />

              <div className="space-y-4 pt-4">
                {complaint.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-muted/50 rounded-lg border p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {comment.author.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {comment.author.role}
                        </Badge>
                        {comment.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}

                {complaint.comments.length === 0 && (
                  <p className="text-muted-foreground text-center text-sm">
                    No comments yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <Card>
            <CardHeader>
              <CardTitle>Reported By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">{complaint.user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Department Info */}
          {complaint.department && (
            <Card>
              <CardHeader>
                <CardTitle>Department</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{complaint.department.name}</p>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complaint.activities.map((activity) => (
                  <div key={activity.id} className="text-sm">
                    <p className="font-medium">
                      {activity.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-muted-foreground">
                      by {activity.user.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
