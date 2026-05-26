import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { createCommentSchema } from "~/schemas/comment.schema";
import {
  createComment,
  getCommentsForComplaint,
} from "~/server/services/comment.service";
import { handleApiError } from "~/lib/errors";

// POST - Add a comment to a complaint
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = createCommentSchema.parse({ ...body, complaintId: id });

    const comment = await createComment(
      data,
      session.user.id,
      session.user.role,
      session.user.name ?? "Someone",
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

// GET - Get all comments for a complaint
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    const { id } = await params;
    const role = session?.user?.role ?? "USER";

    const comments = await getCommentsForComplaint(id, role);
    return NextResponse.json({ comments });
  } catch (err) {
    return handleApiError(err);
  }
}
