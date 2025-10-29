"use client";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  MapPin,
  Clock,
  User as UserIcon,
  CheckCircle,
  Calendar,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import type { Complaint, User, Department } from "@prisma/client";
import { formatDistanceToNow, differenceInDays, format } from "date-fns";

type ResolvedComplaintWithRelations = Complaint & {
  user: User;
  department: Department | null;
  assignedTo?: User | null;
  _count?: {
    comments?: number;
  };
};

interface ResolvedComplaintCardProps {
  complaint: ResolvedComplaintWithRelations;
}

export default function ResolvedComplaintCard({
  complaint,
}: ResolvedComplaintCardProps) {
  const priorityColor = {
    HIGH: "border-red-500/20 bg-red-500/10 text-red-600",
    MEDIUM: "border-orange-500/20 bg-orange-500/10 text-orange-600",
    LOW: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  }[complaint.priority];

  const categoryColor = {
    WATER: "border-blue-500/20 bg-blue-500/10 text-blue-600",
    ELECTRICITY: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
    SANITATION: "border-green-500/20 bg-green-500/10 text-green-600",
    ROADS: "border-gray-500/20 bg-gray-500/10 text-gray-600",
    OTHER: "border-purple-500/20 bg-purple-500/10 text-purple-600",
  }[complaint.category];

  // Calculate resolution time
  const resolutionTime = complaint.resolvedAt
    ? differenceInDays(
        new Date(complaint.resolvedAt),
        new Date(complaint.createdAt),
      )
    : null;

  const resolutionSpeed =
    resolutionTime !== null
      ? resolutionTime <= 1
        ? { label: "Fast", color: "text-green-600" }
        : resolutionTime <= 3
          ? { label: "Normal", color: "text-blue-600" }
          : resolutionTime <= 7
            ? { label: "Slow", color: "text-orange-600" }
            : { label: "Very Slow", color: "text-red-600" }
      : null;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-green-500" />
              <div className="flex-1">
                <h3 className="leading-tight font-semibold">
                  {complaint.title}
                </h3>
                {complaint.department && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {complaint.department.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={categoryColor}>
                {complaint.category}
              </Badge>
              <Badge variant="outline" className={priorityColor}>
                {complaint.priority}
              </Badge>
              <Badge
                variant="outline"
                className="border-green-500/20 bg-green-500/10 text-green-600"
              >
                Resolved
              </Badge>
              {resolutionSpeed && (
                <Badge variant="outline" className={resolutionSpeed.color}>
                  {resolutionSpeed.label} Resolution
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {complaint.details}
        </p>

        {/* Timeline Information */}
        <div className="bg-muted/30 grid gap-3 rounded-lg border p-3 text-sm md:grid-cols-3">
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
              <Calendar className="h-3 w-3" />
              Created
            </div>
            <p className="font-medium">
              {format(new Date(complaint.createdAt), "MMM d, yyyy")}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(complaint.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
              <CheckCircle className="h-3 w-3" />
              Resolved
            </div>
            <p className="font-medium">
              {complaint.resolvedAt
                ? format(new Date(complaint.resolvedAt), "MMM d, yyyy")
                : "N/A"}
            </p>
            <p className="text-muted-foreground text-xs">
              {complaint.resolvedAt
                ? formatDistanceToNow(new Date(complaint.resolvedAt), {
                    addSuffix: true,
                  })
                : "Unknown"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
              <Clock className="h-3 w-3" />
              Resolution Time
            </div>
            <p className="font-medium">
              {resolutionTime !== null ? `${resolutionTime} days` : "N/A"}
            </p>
            <p className="text-muted-foreground text-xs">
              {resolutionTime !== null
                ? resolutionTime === 0
                  ? "Same day"
                  : resolutionTime === 1
                    ? "Next day"
                    : `${resolutionTime} days`
                : "Unknown"}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
          {complaint.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {complaint.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <UserIcon className="h-3.5 w-3.5" />
            {complaint.user.name || "Anonymous"}
          </span>
          {complaint.assignedTo && (
            <span className="flex items-center gap-1">
              Resolved by:{" "}
              {complaint.assignedTo.name || complaint.assignedTo.email}
            </span>
          )}
          {complaint._count?.comments !== undefined && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {complaint._count.comments} comments
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t pt-3">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={`/admin/complaints/${complaint.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
