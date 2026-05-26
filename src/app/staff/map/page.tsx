import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { getComplaintsForMap, getLocations } from "~/server/services/location.service";
import MapView from "~/app/admin/map/MapView";

export default async function StaffMapPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STAFF") {
    redirect("/signin");
  }

  const [complaints, publicLocations] = await Promise.allSettled([
    getComplaintsForMap(session.user.id), // scoped to this staff member's assignments
    getLocations(),
  ]);

  const validComplaints = (
    complaints.status === "fulfilled" ? complaints.value : []
  )
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({ ...c, latitude: c.latitude!, longitude: c.longitude! }));

  const locationsWithAddress = (
    publicLocations.status === "fulfilled" ? publicLocations.value : []
  ).map((l) => ({
    id: l.id,
    name: l.name,
    type: l.type,
    latitude: l.latitude,
    longitude: l.longitude,
    description: l.description ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          My Assignments Map
        </h2>
        <p className="text-muted-foreground">
          Interactive map view of your assigned complaints
        </p>
      </div>

      <MapView
        complaints={validComplaints}
        predefinedLocations={locationsWithAddress}
        userRole="STAFF"
      />
    </div>
  );
}
