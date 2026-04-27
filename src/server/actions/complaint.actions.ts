"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "~/lib/auth-guards";
import { actionOk, actionErr } from "~/lib/api";
import { createComplaintSchema, updateComplaintSchema } from "~/schemas/complaint.schema";
import {
  createComplaint,
  updateComplaint,
  deleteComplaint,
  findSimilarComplaints,
} from "~/server/services/complaint.service";

// ============================================
// Complaint Server Actions
// ============================================

export async function createComplaintAction(raw: unknown) {
  try {
    const session = await requireAuth();
    const data = createComplaintSchema.parse(raw);
    const complaint = await createComplaint(data, session.user.id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/complaints");
    return actionOk(complaint);
  } catch (err) {
    return actionErr(err);
  }
}

export async function updateComplaintAction(id: string, raw: unknown) {
  try {
    const session = await requireRole("ADMIN", "STAFF");
    const data = updateComplaintSchema.parse(raw);
    const complaint = await updateComplaint(id, data, session.user.id);
    revalidatePath("/admin/complaints");
    revalidatePath(`/admin/complaints/${id}`);
    revalidatePath("/staff/complaints");
    revalidatePath(`/staff/complaints/${id}`);
    return actionOk(complaint);
  } catch (err) {
    return actionErr(err);
  }
}

export async function deleteComplaintAction(id: string) {
  try {
    await requireRole("ADMIN");
    await deleteComplaint(id);
    revalidatePath("/admin/complaints");
    return actionOk(undefined);
  } catch (err) {
    return actionErr(err);
  }
}

export async function findSimilarComplaintsAction(
  title: string,
  lat?: number,
  lng?: number,
) {
  try {
    await requireAuth();
    const results = await findSimilarComplaints(title, lat, lng);
    return actionOk(results);
  } catch (err) {
    return actionErr(err);
  }
}
