import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  // 🔒 Only admins can update
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await req.json();
  const { status, assignedToId, departmentId } = data;

  try {
    // ✅ Validate the complaint exists first
    const existing = await db.complaint.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    // ✅ Update complaint
    const updated = await db.complaint.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        // Allow both assigning and unassigning
        assignedToId:
          assignedToId === undefined
            ? existing.assignedToId
            : assignedToId || null,
        ...(departmentId && { departmentId }),
      },
      include: {
        user: true,
        department: true,
        assignedTo: true, // ✅ include staff details
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error updating complaint:", error);
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 },
    );
  }
}
