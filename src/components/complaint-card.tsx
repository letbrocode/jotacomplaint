"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MapPin, Clock, User as UserIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import type { Complaint, Department, User as PrismaUser } from "@prisma/client";

type ComplaintWithRelations = Complaint & {
  user: PrismaUser | null;
  department: Department | null;
  assignedTo?: PrismaUser | null; // ✅ include staff relation if you have it
};

interface ComplaintCardProps {
  complaint: ComplaintWithRelations;
  staffList?: PrismaUser[]; // ✅ list of staff to assign to
}

export default function ComplaintCard({
  complaint,
  staffList = [],
}: ComplaintCardProps) {
  const [status, setStatus] = useState(complaint.status);
  const [assignedTo, setAssignedTo] = useState(complaint.assignedTo?.id ?? "");
  const [updating, setUpdating] = useState(false);

  // ✅ Status Change Handler
  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setStatus(updated.status);
      toast.success(`Complaint status updated to ${updated.status}`);
    } catch (err) {
      toast.error("Error updating status");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  // ✅ Assignment Change Handler
  async function handleAssignChange(staffId: string) {
    if (staffId == "no-staff") return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: staffId }),
      });
      if (!res.ok) throw new Error("Failed to assign staff");
      const updated = await res.json();
      setAssignedTo(updated.assignedToId);
      toast.success(
        `Complaint assigned to ${updated.assignedTo?.name || "staff"}`,
      );
    } catch (err) {
      toast.error("Error assigning staff");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  const statusColor = {
    PENDING: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
    IN_PROGRESS: "bg-blue-500/15 text-blue-600 border-blue-500/20",
    RESOLVED: "bg-green-500/15 text-green-600 border-green-500/20",
  }[status];

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Left Side: Details */}
        <div className="col-span-2 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg font-semibold">
                {complaint.title}
              </CardTitle>
              <div className="flex gap-2">
                <Badge className={statusColor}>{status}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>{complaint.details}</p>

            {complaint.department && (
              <div>
                <span className="text-foreground font-medium">Department:</span>{" "}
                {complaint.department.name}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {complaint.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {complaint.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
              {complaint.user && (
                <span className="flex items-center gap-1">
                  <UserIcon size={14} /> {complaint.user.name ?? "Anonymous"}
                </span>
              )}
            </div>

            {/* Status Update */}
            <div className="flex flex-col gap-3 pt-3 md:flex-row md:items-center md:gap-6">
              {/* Status Dropdown */}
              <div>
                <label className="text-xs font-semibold">Update Status</label>
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger className="mt-1 w-[160px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ Assign Staff Dropdown */}
              <div>
                <label className="text-xs font-semibold">Assign To Staff</label>
                <Select
                  value={assignedTo}
                  onValueChange={handleAssignChange}
                  disabled={updating}
                >
                  <SelectTrigger className="mt-1 w-[160px]">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
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
          </CardContent>
        </div>

        {/* Right Side: Image */}
        {complaint.photoUrl ? (
          <div className="relative h-56 md:h-auto">
            <Image
              src={complaint.photoUrl}
              alt={complaint.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground flex h-56 items-center justify-center md:h-auto">
            No Image
          </div>
        )}
      </div>
    </Card>
  );
}
