import { db } from "~/server/db";
import MapView from "./MapView";

export default async function AdminMapPage() {
  // Fetch all complaints with locations
  const complaints = await db.complaint.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
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
      createdAt: "desc",
    },
  });

  // Fetch public locations (changed from predefinedLocation)
  const publicLocations = await db.publicLocation.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Filter out null coordinates and cast to proper types
  const validComplaints = complaints
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({
      ...c,
      latitude: c.latitude as number,
      longitude: c.longitude as number,
    }));

  // Add address field (null for public locations) to match component type
  const locationsWithAddress = publicLocations.map((l) => ({
    ...l,
    address: null as string | null,
  }));

  console.log("📍 Complaints with locations:", validComplaints.length);
  console.log("📍 Public locations:", locationsWithAddress.length);

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
      />
    </div>
  );
}
