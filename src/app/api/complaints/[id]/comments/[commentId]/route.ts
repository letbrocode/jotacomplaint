import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { updateComment, deleteComment } from "~/server/services/comment.service";
import { handleApiError } from "~/lib/errors";
import { z } from "zod";

const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000).trim(),
});

// PATCH - Update a comment
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await requireAuth();
    const { commentId } = await params;
    const body: unknown = await req.json();
    const { content } = updateCommentSchema.parse(body);
    const updated = await updateComment(commentId, content, session.user.id, session.user.role);
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE - Delete a comment
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await requireAuth();
    const { commentId } = await params;
    await deleteComment(commentId, session.user.id, session.user.role);
    return NextResponse.json({ message: "Comment deleted" });
  } catch (err) {
    return handleApiError(err);
  }
}
