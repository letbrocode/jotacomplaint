"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Activity,
  Image as ImageIcon,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import type { Complaint, User as PrismaUser, Department } from "@prisma/client";
import Image from "next/image";
import ImageModal from "~/components/image-modal";

type ComplaintWithDetails = Complaint & {
  user: PrismaUser;
  department: Department | null;
  assignedTo?: PrismaUser | null;
  comments?: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      role: string;
    };
  }>;
  activities?: Array<{
    id: string;
    action: string;
    oldValue: string | null;
    newValue: string | null;
    comment: string | null;
    createdAt: Date;
    user: {
      name: string | null;
      role: string;
    };
  }>;
};

export default function ComplaintDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<ComplaintWithDetails | null>(null);
  const [staffList, setStaffList] = useState<PrismaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const [complaintRes, staffRes] = await Promise.all([
        fetch(`/api/complaints/${complaintId}`),
        fetch("/api/staff"),
      ]);

      if (!complaintRes.ok) {
        if (complaintRes.status === 404) {
          toast.error("Complaint not found");
          router.push("/admin/complaints");
          return;
        }
        throw new Error("Failed to fetch complaint");
      }

      const complaintData = await complaintRes.json();
      const staffData = await staffRes.json();

      setComplaint(complaintData);
      setStaffList(staffData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load complaint details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [complaintId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!complaint) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();
      setComplaint(updated);
      toast.success("Status updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignmentUpdate = async (staffId: string) => {
    if (!complaint) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: staffId || null }),
      });

      if (!res.ok) throw new Error("Failed to update assignment");

      const updated = await res.json();
      setComplaint(updated);
      toast.success("Assignment updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update assignment");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!complaint || !newComment.trim()) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          isInternal: isInternalComment,
        }),
      });

      if (!res.ok) throw new Error("Failed to add comment");

      const newCommentData = await res.json();

      // Refresh to get updated comments
      await fetchComplaintDetails();

      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add comment");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold">Complaint Not Found</h2>
          <Button
            className="mt-4"
            onClick={() => router.push("/admin/complaints")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Complaints
          </Button>
        </div>
      </div>
    );
  }

  const statusColor = {
    PENDING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
    IN_PROGRESS: "border-blue-500/20 bg-blue-500/10 text-blue-600",
    RESOLVED: "border-green-500/20 bg-green-500/10 text-green-600",
  }[complaint.status];

  const priorityColor = {
    HIGH: "border-red-500/20 bg-red-500/10 text-red-600",
    MEDIUM: "border-orange-500/20 bg-orange-500/10 text-orange-600",
    LOW: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  }[complaint.priority];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Complaint Details</h1>
            <p className="text-muted-foreground text-sm">ID: {complaint.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={statusColor}>
            {complaint.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className={priorityColor}>
            {complaint.priority}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 md:col-span-2">
          {/* Complaint Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {complaint.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Description</h3>
                <p className="text-muted-foreground">{complaint.details}</p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">Submitted by:</span>
                    <span>{complaint.user.name || complaint.user.email}</span>
                  </div>

                  {complaint.department && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">Department:</span>
                      <span>{complaint.department.name}</span>
                    </div>
                  )}

                  {complaint.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">Location:</span>
                      <span>{complaint.location}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">Created:</span>
                    <span>{format(new Date(complaint.createdAt), "PPp")}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">Last Updated:</span>
                    <span>
                      {formatDistanceToNow(new Date(complaint.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {complaint.resolvedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Resolved:</span>
                      <span>
                        {format(new Date(complaint.resolvedAt), "PPp")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo */}
              {complaint.photoUrl && (
                <div>
                  <h3 className="mb-2 font-semibold">Attached Photo</h3>
                  <ImageModal src={complaint.photoUrl} alt={complaint.title} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({complaint.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment List */}
              <div className="max-h-96 space-y-4 overflow-y-auto">
                {complaint.comments && complaint.comments.length > 0 ? (
                  complaint.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`rounded-lg border p-4 ${
                        comment.isInternal
                          ? "border-yellow-500/20 bg-yellow-50/50"
                          : ""
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {comment.author.name || "Unknown"}
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
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No comments yet
                  </p>
                )}
              </div>

              <Separator />

              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="internal" className="text-sm">
                      Internal comment (staff only)
                    </label>
                  </div>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || updating}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Update */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Update Status
                </label>
                <Select
                  value={complaint.status}
                  onValueChange={handleStatusUpdate}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assign Staff */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Assign to Staff
                </label>
                <Select
                  value={complaint.assignedToId || "unassigned"}
                  onValueChange={handleAssignmentUpdate}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name || staff.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {complaint.assignedTo && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium">Currently assigned to:</p>
                  <p className="text-muted-foreground">
                    {complaint.assignedTo.name || complaint.assignedTo.email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 space-y-4 overflow-y-auto">
                {complaint.activities && complaint.activities.length > 0 ? (
                  complaint.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-muted border-l-2 pb-4 pl-4"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {activity.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {activity.comment && (
                        <p className="text-muted-foreground text-sm">
                          {activity.comment}
                        </p>
                      )}
                      {activity.oldValue && activity.newValue && (
                        <p className="text-muted-foreground text-xs">
                          {activity.oldValue} → {activity.newValue}
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        by {activity.user.name || "Unknown"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No activity yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
