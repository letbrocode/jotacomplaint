// Shared Pusher channel and event names.
// Safe to import from both client hooks and server modules.

export const PusherChannels = {
  complaint: (id: string) => `complaint-${id}`,
  userNotifications: (userId: string) => `user-${userId}-notifications`,
  adminDashboard: "admin-dashboard",
  staffQueue: (userId: string) => `staff-${userId}-queue`,
} as const;

export const PusherEvents = {
  COMPLAINT_UPDATED: "complaint:updated",
  COMPLAINT_STATUS_CHANGED: "complaint:status-changed",
  NEW_NOTIFICATION: "notification:new",
  UNREAD_COUNT_CHANGED: "notification:unread-count",
  DASHBOARD_REFRESH: "dashboard:refresh",
} as const;
