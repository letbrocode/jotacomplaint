"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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
  MapPin,
  Calendar,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Activity,
  Send,
  ArrowLeft,
  Navigation,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import ImageModal from "~/components/image-modal";
import { toast } from "sonner";
import { updateComplaintAction } from "~/server/actions/complaint.actions";
import { createCommentAction } from "~/server/actions/comment.actions";
import { useRealtimeComplaint } from "~/hooks/use-realtime-complaint";
import { SlaCountdown } from "~/components/sla-countdown";
import { cn } from "~/lib/utils";
import Link from "next/link";

interface ComplaintStaffDetailsProps {
  complaint: any;
}

export default function ComplaintStaffDetails({
  complaint,
}: ComplaintStaffDetailsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(true);

  // Real-time updates
  useRealtimeComplaint(complaint.id, {
    onUpdate: () => router.refresh(),
  });

  const handleStatusUpdate = async (newStatus: any) => {
    setUpdating(true);
    const result = await updateComplaintAction(complaint.id, { status: newStatus });
    if (result.success) {
      toast.success("Status updated");
    } else {
      toast.error(result.error);
    }
    setUpdating(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setUpdating(true);
    const result = await createCommentAction({
      complaintId: complaint.id,
      content: newComment.trim(),
      isInternal: isInternalComment,
    });
    if (result.success) {
      toast.success("Comment added");
      setNewComment("");
    } else {
      toast.error(result.error);
    }
    setUpdating(false);
  };

  const statusColor = {
    PENDING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
    IN_PROGRESS: "border-blue-500/20 bg-blue-500/10 text-blue-600",
    RESOLVED: "border-green-500/20 bg-green-500/10 text-green-600",
    REJECTED: "border-red-500/20 bg-red-500/10 text-red-600",
    ESCALATED: "border-orange-500/20 bg-orange-500/10 text-orange-600",
  }[complaint.status as string] ?? "";

  const priorityColor = {
    HIGH: "border-red-500/20 bg-red-500/10 text-red-600",
    MEDIUM: "border-orange-500/20 bg-orange-500/10 text-orange-600",
    LOW: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  }[complaint.priority as string] ?? "";

  const hasLocation = complaint.latitude && complaint.longitude;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/staff/complaints">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Officer View</h1>
            <p className="text-muted-foreground text-sm">ID: {complaint.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasLocation && (
            <Button size="sm" asChild>
              <Link href={`/staff/complaints/${complaint.id}/navigate`}>
                <Navigation className="mr-2 h-4 w-4" />
                Navigate
              </Link>
            </Button>
          )}
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
                <AlertCircle className="h-5 w-5 text-primary" />
                {complaint.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Incident Details</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{complaint.details}</p>
              </div>

              <Separator />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">Reporter:</span>
                    <span>{complaint.user.name ?? complaint.user.email}</span>
                  </div>
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
                    <span className="font-medium">Submitted:</span>
                    <span>{format(new Date(complaint.createdAt), "PPp")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">Updated:</span>
                    <span>{formatDistanceToNow(new Date(complaint.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {complaint.photoUrl && (
                <div className="pt-4">
                  <h3 className="mb-3 text-sm font-semibold">Evidence Photo</h3>
                  <div className="max-w-md overflow-hidden rounded-lg border">
                    <ImageModal src={complaint.photoUrl} alt={complaint.title} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discussion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Case Discussion ({complaint.comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {complaint.comments?.map((comment: any) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "rounded-lg border p-4 shadow-sm",
                      comment.isInternal ? "border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/10" : "bg-muted/30"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{comment.author.name ?? "Anonymous"}</span>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {comment.author.role}
                        </Badge>
                        {comment.isInternal && (
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-[10px]">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <Textarea
                  placeholder="Type updates or internal notes..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="accent-primary h-4 w-4 rounded"
                    />
                    <label htmlFor="internal" className="text-sm font-medium">
                      Internal note (staff only)
                    </label>
                  </div>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || updating}
                    className="min-w-[120px]"
                  >
                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Add Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>Case Management</CardTitle>
              <CardDescription>Update progress and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Update Status
                </label>
                <Select value={complaint.status} onValueChange={handleStatusUpdate} disabled={updating}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="ESCALATED">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-background p-3 text-sm shadow-sm">
                <p className="font-semibold">Assigned To You</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Resolve within the SLA period to avoid escalation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Case History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-8px)] before:w-[1px] before:bg-muted">
                {complaint.activities?.map((activity: any) => (
                  <div key={activity.id} className="relative pl-7">
                    <div className="absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border bg-background flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{activity.action.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {format(new Date(activity.createdAt), "PPp")}
                      </span>
                      {activity.comment && <p className="mt-1 text-xs text-muted-foreground italic">"{activity.comment}"</p>}
                      <span className="mt-1 text-[10px] font-medium text-muted-foreground">by {activity.user.name ?? "System"}</span>
                    </div>
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
