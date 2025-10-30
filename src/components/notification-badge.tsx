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
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Determine the correct inbox path based on user role
  const inboxPath =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF"
      ? "/admin/inbox"
      : "/dashboard/inbox";

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <a href={inboxPath}>
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
