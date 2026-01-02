import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import StaffMapView from "./StaffMapView";

export default async function StaffMapPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STAFF") {
    redirect("/signin");
  }

  // Get complaints assigned to this staff member
  const complaints = await db.complaint.findMany({
    where: {
      assignedToId: session.user.id,
      latitude: { not: null },
      longitude: { not: null },
      status: {
        in: ["PENDING", "IN_PROGRESS"],
      },
    },
    select: {
      id: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      latitude: true,
      longitude: true,
      location: true,
    },
    orderBy: {
      priority: "desc",
    },
  });

  const validComplaints = complaints
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({
      ...c,
      latitude: c.latitude as number,
      longitude: c.longitude as number,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Map View</h2>
        <p className="text-muted-foreground">
          View and navigate to your assigned complaints
        </p>
      </div>

      <StaffMapView complaints={validComplaints} />
    </div>
  );
}
