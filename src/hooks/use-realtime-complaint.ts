"use client";

import { useEffect, useCallback } from "react";
import { getPusherClient } from "~/lib/pusher-client";
import { PusherChannels, PusherEvents } from "~/lib/pusher-events";

type ComplaintUpdatePayload = {
  id: string;
  status: string;
  assignedToId: string | null;
  updatedAt: string;
};

type Options = {
  onUpdate?: (data: ComplaintUpdatePayload) => void;
  onStatusChange?: (data: { status: string }) => void;
};

/**
 * Subscribe to live updates for a specific complaint.
 * Use in admin/staff complaint detail pages.
 */
export function useRealtimeComplaint(complaintId: string, options: Options = {}) {
  const { onUpdate, onStatusChange } = options;

  const handleUpdate = useCallback(
    (data: ComplaintUpdatePayload) => {
      onUpdate?.(data);
    },
    [onUpdate],
  );

  const handleStatusChange = useCallback(
    (data: { status: string }) => {
      onStatusChange?.(data);
    },
    [onStatusChange],
  );

  useEffect(() => {
    if (!complaintId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(PusherChannels.complaint(complaintId));

    channel.bind(PusherEvents.COMPLAINT_UPDATED, handleUpdate);
    channel.bind(PusherEvents.COMPLAINT_STATUS_CHANGED, handleStatusChange);

    return () => {
      channel.unbind(PusherEvents.COMPLAINT_UPDATED, handleUpdate);
      channel.unbind(PusherEvents.COMPLAINT_STATUS_CHANGED, handleStatusChange);
      pusher.unsubscribe(PusherChannels.complaint(complaintId));
    };
  }, [complaintId, handleUpdate, handleStatusChange]);
}
