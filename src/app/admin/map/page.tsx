import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { getComplaintsForMap, getLocations } from "~/server/services/location.service";
import MapView from "./MapView";

export default async function AdminMapPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/signin");
  }

  const [complaints, publicLocations] = await Promise.allSettled([
    getComplaintsForMap(), // all geolocated complaints for admin
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
        <h2 className="text-3xl font-bold tracking-tight">Complaints Map</h2>
        <p className="text-muted-foreground">
          Interactive map view of all complaints and municipal facilities
        </p>
      </div>

      <MapView
        complaints={validComplaints}
        predefinedLocations={locationsWithAddress}
        userRole="ADMIN"
      />
    </div>
  );
}
