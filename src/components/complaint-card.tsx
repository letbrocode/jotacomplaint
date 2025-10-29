"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  MapPin,
  Clock,
  User as UserIcon,
  MessageSquare,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import type { User as PrismaUser } from "@prisma/client";
import type { ComplaintWithRelations } from "~/types/complaint"; // Import from shared file

interface ComplaintCardProps {
  complaint: ComplaintWithRelations;
  staffList?: PrismaUser[];
  onUpdate?: (updatedComplaint: ComplaintWithRelations) => void;
}

export default function ComplaintCard({
  complaint,
  staffList = [],
  onUpdate,
}: ComplaintCardProps) {
  const [status, setStatus] = useState(complaint.status);
  const [assignedTo, setAssignedTo] = useState(complaint.assignedTo?.id ?? "");
  const [updating, setUpdating] = useState(false);

  // Generic update handler with optimistic updates
  async function handleUpdate(
    updateData: Record<string, any>,
    successMessage: string,
    optimisticUpdate?: Partial<ComplaintWithRelations>,
  ) {
    setUpdating(true);

    // Optimistic update
    if (optimisticUpdate && onUpdate) {
      onUpdate({ ...complaint, ...optimisticUpdate });
    }

    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Update failed");
      }

      const updated = await res.json();

      // Update local state
      if (updateData.status !== undefined) setStatus(updated.status);
      if (updateData.assignedToId !== undefined)
        setAssignedTo(updated.assignedToId || "");

      // Call parent callback with full updated data
      if (onUpdate) {
        onUpdate(updated);
      }

      toast.success(successMessage);
    } catch (err) {
      // Revert optimistic update on error
      if (optimisticUpdate && onUpdate) {
        onUpdate(complaint); // Revert to original
      }

      toast.error(
        err instanceof Error ? err.message : "Error updating complaint",
      );
      console.error(err);

      // Revert local state
      setStatus(complaint.status);
      setAssignedTo(complaint.assignedTo?.id ?? "");
    } finally {
      setUpdating(false);
    }
  }

  // Status Change Handler
  async function handleStatusChange(newStatus: string) {
    await handleUpdate(
      { status: newStatus },
      `Status updated to ${newStatus}`,
      { status: newStatus as any },
    );
  }

  // Assignment Change Handler
  async function handleAssignChange(staffId: string) {
    if (staffId === "unassigned") {
      await handleUpdate({ assignedToId: null }, "Complaint unassigned", {
        assignedTo: null,
        assignedToId: null,
      });
      return;
    }

    const selectedStaff = staffList.find((s) => s.id === staffId);
    await handleUpdate(
      { assignedToId: staffId },
      `Assigned to ${selectedStaff?.name || "staff"}`,
      { assignedTo: selectedStaff || null, assignedToId: staffId },
    );
  }

  // Priority badge colors
  const priorityColor = {
    HIGH: "bg-red-500/15 text-red-600 border-red-500/20",
    MEDIUM: "bg-orange-500/15 text-orange-600 border-orange-500/20",
    LOW: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  }[complaint.priority];

  // Status badge colors
  const statusColor = {
    PENDING: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
    IN_PROGRESS: "bg-blue-500/15 text-blue-600 border-blue-500/20",
    RESOLVED: "bg-green-500/15 text-green-600 border-green-500/20",
  }[status];

  const isOverdue =
    status !== "RESOLVED" &&
    new Date(complaint.createdAt).getTime() <
      Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Left Side: Details */}
        <div className="col-span-2 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold">
                  {complaint.title}
                </CardTitle>
                {complaint.department && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {complaint.department.name}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={priorityColor}>
                  {complaint.priority}
                </Badge>
                <Badge variant="outline" className={statusColor}>
                  {status.replace("_", " ")}
                </Badge>
                {isOverdue && (
                  <Badge
                    variant="outline"
                    className="border-red-500/20 bg-red-500/10 text-red-600"
                  >
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p className="line-clamp-2">{complaint.details}</p>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {complaint.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {complaint.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" />{" "}
                {complaint.user?.name ?? "Anonymous"}
              </span>
              {complaint._count?.comments !== undefined && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {complaint._count.comments} comments
                </span>
              )}
              {complaint._count?.activities !== undefined && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" />
                  {complaint._count.activities} activities
                </span>
              )}
            </div>

            {/* Assigned To Display */}
            {complaint.assignedTo && (
              <div className="bg-muted/50 rounded-md p-2 text-xs">
                <span className="font-semibold">Assigned to:</span>{" "}
                {complaint.assignedTo.name || complaint.assignedTo.email}
              </div>
            )}

            {/* Admin Controls */}
            <div className="flex flex-col gap-3 border-t pt-3 md:flex-row md:items-center md:gap-6">
              {/* Status Dropdown */}
              <div className="flex-1">
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Update Status
                </label>
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Update complaint status"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assign Staff Dropdown */}
              <div className="flex-1">
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Assign to Staff
                </label>
                <Select
                  value={assignedTo || "unassigned"}
                  onValueChange={handleAssignChange}
                  disabled={updating}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Assign complaint to staff"
                  >
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <span className="text-muted-foreground">Unassigned</span>
                    </SelectItem>
                    {staffList.length > 0 ? (
                      staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name ?? staff.email}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-staff" disabled>
                        No staff available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 border-t pt-3">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={`/admin/complaints/${complaint.id}`}>View Details</a>
              </Button>
            </div>
          </CardContent>
        </div>

        {/* Right Side: Image */}
        {complaint.photoUrl ? (
          <div className="relative h-64 md:h-auto">
            <Image
              src={complaint.photoUrl}
              alt={complaint.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground flex h-64 items-center justify-center md:h-auto">
            <div className="text-center">
              <MapPin className="mx-auto mb-2 h-12 w-12 opacity-20" />
              <p className="text-xs">No Image</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {updating && (
        <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="bg-background flex items-center gap-2 rounded-md px-4 py-2 shadow-lg">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-sm font-medium">Updating...</span>
          </div>
        </div>
      )}
    </Card>
  );
}
