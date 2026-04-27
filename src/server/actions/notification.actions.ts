"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "~/lib/auth-guards";
import { actionOk, actionErr } from "~/lib/api";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "~/server/services/notification.service";

// ============================================
// Notification Server Actions
// ============================================

export async function markNotificationReadAction(notificationId: string) {
  try {
    const session = await requireAuth();
    await markNotificationRead(notificationId, session.user.id);
    revalidatePath("/dashboard/notifications");
    revalidatePath("/admin/notifications");
    revalidatePath("/staff/notifications");
    return actionOk(undefined);
  } catch (err) {
    return actionErr(err);
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await requireAuth();
    await markAllNotificationsRead(session.user.id);
    revalidatePath("/dashboard/notifications");
    revalidatePath("/admin/notifications");
    revalidatePath("/staff/notifications");
    return actionOk(undefined);
  } catch (err) {
    return actionErr(err);
  }
}
