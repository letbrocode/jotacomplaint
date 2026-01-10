"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export function NotificationBadge() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = (await res.json()) as { count: number };
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    if (session?.user) {
      void fetchUnreadCount();

      // Poll every 30 seconds for new notifications
      const interval = setInterval(() => {
        void fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [session]);

  // Determine the correct notifications path based on user role
  const notificationsPath =
    session?.user?.role === "ADMIN"
      ? "/admin/notifications"
      : session?.user?.role === "STAFF"
        ? "/staff/notifications"
        : "/dashboard/notifications";

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <a href={notificationsPath}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </a>
    </Button>
  );
}
