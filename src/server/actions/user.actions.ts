"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "~/lib/auth-guards";
import { actionOk, actionErr } from "~/lib/api";
import { updateProfileSchema, changePasswordSchema } from "~/schemas/user.schema";
import {
  updateUserProfile,
  changeUserPassword,
  deactivateUser,
} from "~/server/services/user.service";

// ============================================
// User / Profile Server Actions
// ============================================

export async function updateProfileAction(raw: unknown) {
  try {
    const session = await requireAuth();
    const data = updateProfileSchema.parse(raw);
    const user = await updateUserProfile(session.user.id, data);
    revalidatePath("/dashboard/settings");
    return actionOk(user);
  } catch (err) {
    return actionErr(err);
  }
}

export async function changePasswordAction(raw: unknown) {
  try {
    const session = await requireAuth();
    const { currentPassword, newPassword } = changePasswordSchema.parse(raw);
    await changeUserPassword(session.user.id, currentPassword, newPassword);
    return actionOk(undefined);
  } catch (err) {
    return actionErr(err);
  }
}

export async function deleteAccountAction() {
  try {
    const session = await requireAuth();
    await deactivateUser(session.user.id);
    revalidatePath("/");
    return actionOk(undefined);
  } catch (err) {
    return actionErr(err);
  }
}
