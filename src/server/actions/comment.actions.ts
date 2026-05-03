"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "~/lib/auth-guards";
import { actionOk, actionErr } from "~/lib/api";
import { createCommentSchema } from "~/schemas/comment.schema";
import { createComment } from "~/server/services/comment.service";
import { triggerComplaintUpdate } from "~/lib/pusher";

export async function createCommentAction(raw: unknown) {
  try {
    const session = await requireAuth();
    const data = createCommentSchema.parse(raw);

    const comment = await createComment(
      data,
      session.user.id!,
      session.user.role,
      session.user.name ?? session.user.email ?? "Unknown",
    );

    // Trigger real-time update for the complaint detail page
    await triggerComplaintUpdate(data.complaintId, {
      id: data.complaintId,
      commentAdded: true,
    }).catch(() => null);

    revalidatePath(`/admin/complaints/${data.complaintId}`);
    revalidatePath(`/dashboard/complaints/${data.complaintId}`);
    revalidatePath(`/staff/complaints/${data.complaintId}`);

    return actionOk(comment);
  } catch (err) {
    return actionErr(err);
  }
}
