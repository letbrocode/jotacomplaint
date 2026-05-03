import Pusher from "pusher";
import { PusherChannels, PusherEvents } from "~/lib/pusher-events";

// ============================================
// Server-side Pusher client
// Used in Server Actions and API routes to
// trigger real-time events after mutations.
// ============================================

if (
  !process.env.PUSHER_APP_ID ||
  !process.env.PUSHER_KEY ||
  !process.env.PUSHER_SECRET ||
  !process.env.PUSHER_CLUSTER
) {
  throw new Error(
    "Missing Pusher server env vars: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER",
  );
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// ============================================
// Trigger helpers — call these from actions/routes
// ============================================

export async function triggerComplaintUpdate(
  complaintId: string,
  data: Record<string, unknown>,
) {
  await pusherServer.trigger(
    PusherChannels.complaint(complaintId),
    PusherEvents.COMPLAINT_UPDATED,
    data,
  );
}

export async function triggerUserNotification(
  userId: string,
  data: { title: string; message: string; unreadCount: number },
) {
  await pusherServer.trigger(
    PusherChannels.userNotifications(userId),
    PusherEvents.NEW_NOTIFICATION,
    data,
  );
}

export async function triggerDashboardRefresh() {
  await pusherServer.trigger(
    PusherChannels.adminDashboard,
    PusherEvents.DASHBOARD_REFRESH,
    { timestamp: new Date().toISOString() },
  );
}
