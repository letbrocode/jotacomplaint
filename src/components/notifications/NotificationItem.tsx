"use client";

import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  UserPlus,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { Notification } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

type NotificationWithComplaint = Notification & {
  complaint?: {
    id: string;
    title: string;
  } | null;
};

interface NotificationItemProps {
  notification: NotificationWithComplaint;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: "ADMIN" | "STAFF" | "USER";
}

const notificationIcons = {
  COMPLAINT_CREATED: Bell,
  COMPLAINT_ASSIGNED: UserPlus,
  STATUS_UPDATED: AlertCircle,
  COMMENT_ADDED: MessageSquare,
  RESOLVED: CheckCircle,
};

const notificationColors = {
  COMPLAINT_CREATED: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  COMPLAINT_ASSIGNED: "border-purple-500/20 bg-purple-500/10 text-purple-600",
  STATUS_UPDATED: "border-orange-500/20 bg-orange-500/10 text-orange-600",
  COMMENT_ADDED: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600",
  RESOLVED: "border-green-500/20 bg-green-500/10 text-green-600",
};

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  userRole,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Bell;
  const colorClass =
    notificationColors[notification.type] ||
    "border-gray-500/20 bg-gray-500/10 text-gray-600";

  // Get correct complaint link based on user role
  const getComplaintLink = () => {
    if (!notification.complaintId) return null;

    if (userRole === "ADMIN") {
      return `/admin/complaints/${notification.complaintId}`;
    } else if (userRole === "STAFF") {
      return `/staff/complaints/${notification.complaintId}`;
    } else {
      return `/dashboard/complaints/${notification.complaintId}`;
    }
  };

  const complaintLink = getComplaintLink();

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        !notification.isRead
          ? "border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
          : ""
      }`}
    >
      <div className="flex gap-4 p-4">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${colorClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold">{notification.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {notification.message}
              </p>

              {/* Complaint Link */}
              {notification.complaint && complaintLink && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 h-auto p-0 text-xs"
                  asChild
                >
                  <a href={complaintLink}>
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View complaint: {notification.complaint.title}
                  </a>
                </Button>
              )}
            </div>

            {/* Unread indicator */}
            {!notification.isRead && (
              <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {notification.type.replace(/_/g, " ")}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-8"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Mark read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
