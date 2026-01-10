"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom current location icon
const currentLocationIcon = L.divIcon({
  className: "current-location-marker",
  html: `
    <div style="
      background-color: #3b82f6;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type SimpleMapProps = {
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  currentLocation?: { lat: number; lng: number } | null;
  height?: string;
};

export default function SimpleMap({
  latitude,
  longitude,
  title,
  description,
  currentLocation,
  height = "400px",
}: SimpleMapProps) {
  const destination: [number, number] = [latitude, longitude];

  // Calculate center point between current location and destination
  const center: [number, number] = currentLocation
    ? [
        (currentLocation.lat + latitude) / 2,
        (currentLocation.lng + longitude) / 2,
      ]
    : destination;

  return (
    <MapContainer
      center={center}
      zoom={currentLocation ? 13 : 15}
      style={{
        height,
        width: "100%",
        borderRadius: "0 0 0.5rem 0.5rem",
        zIndex: 0,
      }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Destination Marker */}
      <Marker position={destination}>
        <Popup>
          <div className="space-y-1">
            <p className="font-semibold">{title}</p>
            {description && (
              <p className="text-muted-foreground text-xs">{description}</p>
            )}
          </div>
        </Popup>
      </Marker>

      {/* Current Location Marker */}
      {currentLocation && (
        <>
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={currentLocationIcon}
          >
            <Popup>
              <p className="font-semibold">Your Location</p>
            </Popup>
          </Marker>

          {/* Accuracy circle */}
          <Circle
            center={[currentLocation.lat, currentLocation.lng]}
            radius={50}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
            }}
          />
        </>
      )}
    </MapContainer>
  );
}
