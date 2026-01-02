"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Navigation } from "lucide-react";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons based on priority
const createCustomIcon = (priority: string) => {
  const color =
    priority === "HIGH"
      ? "#ef4444"
      : priority === "MEDIUM"
        ? "#f59e0b"
        : "#10b981";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          margin-top: 4px;
          text-align: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">!</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
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

type StaffComplaintsMapProps = {
  complaints: Complaint[];
  onComplaintClick: (complaint: Complaint) => void;
  height?: string;
};

export default function StaffComplaintsMap({
  complaints,
  onComplaintClick,
  height = "600px",
}: StaffComplaintsMapProps) {
  // Default center to first complaint or Mumbai
  const center: [number, number] =
    complaints.length > 0
      ? [complaints[0]!.latitude, complaints[0]!.longitude]
      : [19.076, 72.8777]; // Mumbai coordinates

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500";
      case "MEDIUM":
        return "bg-amber-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
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
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {complaints.map((complaint) => (
        <Marker
          key={complaint.id}
          position={[complaint.latitude, complaint.longitude]}
          icon={createCustomIcon(complaint.priority)}
        >
          <Popup maxWidth={300}>
            <div className="space-y-3 p-2">
              <div>
                <h3 className="font-semibold">{complaint.title}</h3>
                {complaint.location && (
                  <p className="text-muted-foreground text-xs">
                    {complaint.location}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={
                    complaint.priority === "HIGH"
                      ? "destructive"
                      : complaint.priority === "MEDIUM"
                        ? "warning"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {complaint.priority}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {complaint.category}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onComplaintClick(complaint)}
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/staff/complaints/${complaint.id}/navigate`;
                  }}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
