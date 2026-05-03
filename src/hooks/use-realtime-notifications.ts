"use client";

import { useEffect, useState, useCallback } from "react";
import { getPusherClient } from "~/lib/pusher-client";
import { PusherChannels, PusherEvents } from "~/lib/pusher-events";

type NotificationPayload = {
  title: string;
  message: string;
  unreadCount: number;
};

type Options = {
  initialUnreadCount?: number;
  onNewNotification?: (payload: NotificationPayload) => void;
};

/**
 * Subscribe to real-time notification updates for the current user.
 * Returns the live unread count + latest notification payload.
 */
export function useRealtimeNotifications(userId: string, options: Options = {}) {
  const [unreadCount, setUnreadCount] = useState(options.initialUnreadCount ?? 0);
  const [latestNotification, setLatestNotification] = useState<NotificationPayload | null>(null);

  const handleNew = useCallback(
    (data: NotificationPayload) => {
      setUnreadCount(data.unreadCount);
      setLatestNotification(data);
      options.onNewNotification?.(data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.onNewNotification],
  );

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(PusherChannels.userNotifications(userId));

    channel.bind(PusherEvents.NEW_NOTIFICATION, handleNew);
    channel.bind(PusherEvents.UNREAD_COUNT_CHANGED, ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PusherChannels.userNotifications(userId));
    };
  }, [userId, handleNew]);

  return { unreadCount, latestNotification };
}
