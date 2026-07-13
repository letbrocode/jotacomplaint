"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import {
  MapPin,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Activity,
  Send,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import ImageModal from "~/components/image-modal";
import { toast } from "sonner";
import { createCommentAction } from "~/server/actions/comment.actions";
import { SlaCountdown } from "~/components/sla-countdown";
import type { ComplaintDetailsWithRelations } from "~/types/complaint";

interface ComplaintUserDetailsProps {
  complaint: ComplaintDetailsWithRelations;
  photoUrl?: string | null;
}

export default function ComplaintUserDetails({
  complaint,
  photoUrl,
}: ComplaintUserDetailsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setUpdating(true);
    const result = await createCommentAction({
      complaintId: complaint.id,
      content: newComment.trim(),
      isInternal: false,
    });
    if (result.success) {
      toast.success("Comment added");
      setNewComment("");
    } else {
      toast.error(result.error);
    }
    setUpdating(false);
  };

  const statusColor =
    {
      PENDING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
      IN_PROGRESS: "border-blue-500/20 bg-blue-500/10 text-blue-600",
      RESOLVED: "border-green-500/20 bg-green-500/10 text-green-600",
      REJECTED: "border-red-500/20 bg-red-500/10 text-red-600",
      ESCALATED: "border-orange-500/20 bg-orange-500/10 text-orange-600",
    }[complaint.status as string] ?? "";

  const priorityColor =
    {
      HIGH: "border-red-500/20 bg-red-500/10 text-red-600",
      MEDIUM: "border-orange-500/20 bg-orange-500/10 text-orange-600",
      LOW: "border-blue-500/20 bg-blue-500/10 text-blue-600",
    }[complaint.priority as string] ?? "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Track Complaint</h1>
            <p className="text-muted-foreground text-sm">ID: {complaint.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusColor}>
            {complaint.status.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline" className={priorityColor}>
            {complaint.priority}
          </Badge>
          <SlaCountdown
            dueDate={complaint.dueDate}
            status={complaint.status}
            className="text-xs font-semibold"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-primary h-5 w-5" />
                {complaint.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  My Complaint Details
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {complaint.details}
                </p>
              </div>

              <Separator />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  {complaint.department && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">Department:</span>
                      <span>{complaint.department.name}</span>
                    </div>
                  )}
                  {complaint.location && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                      <div>
                        <span className="font-medium">Location:</span>
                        <p className="mt-0.5">{complaint.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">Submitted on:</span>
                    <span>{format(new Date(complaint.createdAt), "PPp")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">Last updated:</span>
                    <span>
                      {formatDistanceToNow(new Date(complaint.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {complaint.resolvedAt && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Resolved:</span>
                      <span>
                        {format(new Date(complaint.resolvedAt), "PPp")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {photoUrl && (
                <div className="pt-4">
                  <h3 className="mb-3 text-sm font-semibold">
                    Submitted Photo
                  </h3>
                  <div className="max-w-md overflow-hidden rounded-lg border">
                    <ImageModal src={photoUrl} alt={complaint.title} />
                  </div>
                </div>
              )}

              {complaint.status === "REJECTED" && complaint.rejectionNote && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    Reason for Rejection
                  </div>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                    {complaint.rejectionNote}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discussion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="text-primary h-5 w-5" />
                Discussion ({complaint.comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {complaint.comments?.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-muted/30 rounded-lg border p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {comment.author.name ?? "Anonymous"}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] tracking-wider uppercase"
                        >
                          {comment.author.role === "USER"
                            ? "You"
                            : comment.author.role}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground text-[10px]">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
                {(!complaint.comments || complaint.comments.length === 0) && (
                  <div className="py-8 text-center">
                    <MessageSquare className="text-muted-foreground/20 mx-auto mb-2 h-12 w-12" />
                    <p className="text-muted-foreground text-sm">
                      No messages yet
                    </p>
                  </div>
                )}
              </div>

              {complaint.status !== "RESOLVED" &&
                complaint.status !== "REJECTED" && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a message or update..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || updating}
                          className="min-w-[120px]"
                        >
                          {updating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="text-primary h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="before:bg-muted relative space-y-4 before:absolute before:top-2 before:left-[11px] before:h-[calc(100%-8px)] before:w-[1px]">
                {complaint.activities?.map((activity) => (
                  <div key={activity.id} className="relative pl-7">
                    <div className="bg-background absolute top-1.5 left-0 flex h-[22px] w-[22px] items-center justify-center rounded-full border">
                      <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {activity.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {format(new Date(activity.createdAt), "PPp")}
                      </span>
                      {activity.user.role !== "USER" && (
                        <span className="text-primary mt-1 text-[10px] font-medium">
                          Official Action
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-xs">
              <p>1. Our team reviews your complaint.</p>
              <p>2. A staff member is assigned to investigate.</p>
              <p>3. Check back here for status updates and staff replies.</p>
              <p>4. Once fixed, the status will change to Resolved.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
