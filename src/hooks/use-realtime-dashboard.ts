"use client";

import { useEffect, useState, useCallback } from "react";
import { getPusherClient } from "~/lib/pusher-client";
import { PusherChannels, PusherEvents } from "~/lib/pusher-events";

type Options = {
  onRefresh?: () => void;
};

/**
 * Subscribe to admin dashboard refresh events.
 * Calls onRefresh when the server signals new data is available.
 * Use in conjunction with router.refresh() or a data fetcher.
 */
export function useRealtimeDashboard(options: Options = {}) {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const handleRefresh = useCallback(
    ({ timestamp }: { timestamp: string }) => {
      setLastRefreshed(new Date(timestamp));
      options.onRefresh?.();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.onRefresh],
  );

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PusherChannels.adminDashboard);

    channel.bind(PusherEvents.DASHBOARD_REFRESH, handleRefresh);

    return () => {
      channel.unbind(PusherEvents.DASHBOARD_REFRESH, handleRefresh);
      pusher.unsubscribe(PusherChannels.adminDashboard);
    };
  }, [handleRefresh]);

  return { lastRefreshed };
}
