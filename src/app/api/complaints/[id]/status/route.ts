import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { ActivityAction, Status } from "@prisma/client";

type UpdateStatusBody = {
  status: Status;
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== "STAFF" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as UpdateStatusBody;
    const { status } = body;

    // Update status
    const complaint = await db.complaint.update({
      where: { id: params.id },
      data: {
        status,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });

    // Log activity
    await db.complaintActivity.create({
      data: {
        complaintId: params.id,
        userId: session.user.id,
        action: ActivityAction.STATUS_CHANGED,
        newValue: status,
      },
    });

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}
