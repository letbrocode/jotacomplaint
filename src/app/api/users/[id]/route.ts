import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { isActive: boolean | undefined };
    const isActive = body.isActive;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid isActive value" },
        { status: 400 },
      );
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: {
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            complaints: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has active complaints
    const userWithComplaints = await db.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            complaints: true,
          },
        },
      },
    });

    if (!userWithComplaints) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userWithComplaints._count.complaints > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete user with ${userWithComplaints._count.complaints} active complaint(s). Please resolve or reassign complaints first.`,
        },
        { status: 400 },
      );
    }

    await db.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
