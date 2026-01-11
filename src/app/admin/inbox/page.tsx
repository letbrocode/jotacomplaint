"use client";

import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  Bell,
  BellOff,
  Inbox,
  Archive,
  Trash2,
} from "lucide-react";
import type { Notification } from "@prisma/client";
import NotificationItem from "~/components/notification-item";

type NotificationWithComplaint = Notification & {
  complaint?: {
    id: string;
    title: string;
  } | null;
};

export default function InboxPage() {
  const [notifications, setNotifications] = useState<
    NotificationWithComplaint[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data = (await res.json()) as NotificationWithComplaint[];
      setNotifications(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load notifications",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete notification");

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all notifications?")) return;

    try {
      const res = await fetch("/api/notifications/delete-all", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete all notifications");

      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold">Error Loading Notifications</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={fetchNotifications}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">
            Manage your notifications and stay updated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground mt-1 text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <Button
            onClick={fetchNotifications}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats and Actions */}
      <div className="bg-card flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Bell className="text-muted-foreground h-5 w-5" />
            <span className="text-sm font-medium">
              {notifications.length} total
            </span>
          </div>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-blue-500">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAll}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete all
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="relative">
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2 bg-blue-500">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">
            Read
            {readNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {readNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Notifications */}
        <TabsContent value="all" className="space-y-2">
          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
              <p className="text-muted-foreground text-sm">
                You&apos;re all caught up! Check back later for updates.
              </p>
            </Card>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>

        {/* Unread Notifications */}
        <TabsContent value="unread" className="space-y-2">
          {unreadNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <BellOff className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 text-lg font-semibold">
                No unread notifications
              </h3>
              <p className="text-muted-foreground text-sm">
                All notifications have been read.
              </p>
            </Card>
          ) : (
            unreadNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>

        {/* Read Notifications */}
        <TabsContent value="read" className="space-y-2">
          {readNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Archive className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 text-lg font-semibold">
                No read notifications
              </h3>
              <p className="text-muted-foreground text-sm">
                Read notifications will appear here.
              </p>
            </Card>
          ) : (
            readNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
