"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  LayerGroup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ExternalLink } from "lucide-react";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom complaint marker icons
const createComplaintIcon = (color: string, priority: string) => {
  const emoji =
    priority === "HIGH" ? "🔴" : priority === "MEDIUM" ? "🟡" : "🟢";
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">${emoji}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Predefined location icons
const createLocationIcon = (type: string) => {
  const icons: Record<string, string> = {
    GARBAGE_BIN: "🗑️",
    DUMP_YARD: "🏭",
    COLLECTION_CENTER: "📦",
    RECYCLING_CENTER: "♻️",
    WATER_TREATMENT: "💧",
    ELECTRICAL_SUBSTATION: "⚡",
  };

  const colors: Record<string, string> = {
    GARBAGE_BIN: "#10b981",
    DUMP_YARD: "#f59e0b",
    COLLECTION_CENTER: "#3b82f6",
    RECYCLING_CENTER: "#8b5cf6",
    WATER_TREATMENT: "#06b6d4",
    ELECTRICAL_SUBSTATION: "#eab308",
  };

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${colors[type] || "#10b981"};
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        font-size: 18px;
      ">${icons[type] || "📍"}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const priorityColors = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#3b82f6",
};

const statusColors = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  RESOLVED: "#10b981",
  REJECTED: "#6b7280",
};

type Complaint = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  latitude: number;
  longitude: number;
  location?: string | null;
};

type PredefinedLocation = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  description?: string | null;
};

type AdminComplaintsMapProps = {
  complaints: Complaint[];
  predefinedLocations?: PredefinedLocation[];
  onComplaintClick?: (complaint: Complaint) => void;
  height?: string;
  showPredefined?: boolean;
  userRole?: "ADMIN" | "STAFF" | "USER";
};

// Helper component to fit bounds
function MapBoundsUpdater({
  complaints,
  predefinedLocations,
}: {
  complaints: Complaint[];
  predefinedLocations: PredefinedLocation[];
}) {
  const map = useMap();

  useEffect(() => {
    if (complaints.length === 0 && predefinedLocations.length === 0) return;

    const allPoints: L.LatLngExpression[] = [
      ...complaints.map((c) => [c.latitude, c.longitude] as L.LatLngExpression),
      ...predefinedLocations.map(
        (l) => [l.latitude, l.longitude] as L.LatLngExpression,
      ),
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, complaints, predefinedLocations]);

  return null;
}

export default function AdminComplaintsMap({
  complaints,
  predefinedLocations = [],
  onComplaintClick,
  height = "600px",
  showPredefined = true,
  userRole = "ADMIN",
}: AdminComplaintsMapProps) {
  const center: [number, number] =
    complaints.length > 0
      ? [complaints[0]!.latitude, complaints[0]!.longitude]
      : predefinedLocations.length > 0
        ? [predefinedLocations[0]!.latitude, predefinedLocations[0]!.longitude]
        : [19.076, 72.8777]; // Default to Mumbai

  // Get correct complaint URL based on role
  const getComplaintUrl = (complaintId: string) => {
    if (userRole === "ADMIN") {
      return `/admin/complaints/${complaintId}`;
    } else if (userRole === "STAFF") {
      return `/staff/complaints/${complaintId}`;
    }
    return `/dashboard/complaints/${complaintId}`;
  };

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{
        height,
        width: "100%",
        borderRadius: "0.5rem",
        zIndex: 0,
        position: "relative",
      }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater
        complaints={complaints}
        predefinedLocations={showPredefined ? predefinedLocations : []}
      />

      {/* Complaints Layer */}
      <LayerGroup>
        {complaints.map((complaint) => (
          <Marker
            key={complaint.id}
            position={[complaint.latitude, complaint.longitude]}
            icon={createComplaintIcon(
              statusColors[complaint.status as keyof typeof statusColors] ||
                "#6b7280",
              complaint.priority,
            )}
          >
            {/* Tooltip shows on hover */}
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="text-sm">
                <p className="font-semibold">{complaint.title}</p>
                <div className="mt-1 flex gap-1">
                  <span className="text-xs">{complaint.priority}</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">{complaint.status}</span>
                </div>
              </div>
            </Tooltip>

            {/* Popup shows on click */}
            <Popup maxWidth={300}>
              <div className="space-y-3 p-2">
                <div>
                  <h3 className="text-base leading-tight font-semibold">
                    {complaint.title}
                  </h3>
                  {complaint.location && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      📍 {complaint.location}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {complaint.category}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor:
                        priorityColors[
                          complaint.priority as keyof typeof priorityColors
                        ] + "20",
                      color:
                        priorityColors[
                          complaint.priority as keyof typeof priorityColors
                        ],
                      borderColor:
                        priorityColors[
                          complaint.priority as keyof typeof priorityColors
                        ],
                    }}
                  >
                    {complaint.priority}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor:
                        statusColors[
                          complaint.status as keyof typeof statusColors
                        ] + "20",
                      color:
                        statusColors[
                          complaint.status as keyof typeof statusColors
                        ],
                    }}
                  >
                    {complaint.status}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    window.location.href = getComplaintUrl(complaint.id);
                  }}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View Details
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>

      {/* Predefined Locations Layer */}
      {showPredefined && predefinedLocations.length > 0 && (
        <LayerGroup>
          {predefinedLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createLocationIcon(location.type)}
            >
              {/* Tooltip for hover */}
              <Tooltip direction="top" offset={[0, -18]} opacity={0.9}>
                <div className="text-sm">
                  <p className="font-semibold">{location.name}</p>
                  <p className="text-xs">{location.type.replace(/_/g, " ")}</p>
                </div>
              </Tooltip>

              {/* Popup for click */}
              <Popup maxWidth={280}>
                <div className="space-y-2 p-2">
                  <div>
                    <h3 className="text-base font-semibold">{location.name}</h3>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {location.type.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {location.address && (
                    <p className="text-muted-foreground text-sm">
                      📍 {location.address}
                    </p>
                  )}

                  {location.description && (
                    <p className="text-muted-foreground text-xs">
                      {location.description}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
      )}
    </MapContainer>
  );
}
