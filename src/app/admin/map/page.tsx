import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import MapView from "./MapView";

export default async function AdminMapPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/signin");
  }

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

  // Fetch public locations
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
      latitude: c.latitude!,
      longitude: c.longitude!,
    }));

  // Map public locations to match the component's expected type
  const locationsWithAddress = publicLocations.map((l) => ({
    id: l.id,
    name: l.name,
    type: l.type,
    latitude: l.latitude,
    longitude: l.longitude,
    // address: l.address ?? null,
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
