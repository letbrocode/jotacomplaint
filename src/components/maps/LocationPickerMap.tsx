"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // ADD THIS LINE

// Fix default marker icon issue in Leaflet + Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LatLng = {
  latitude: number;
  longitude: number;
};

type LocationPickerMapProps = {
  value?: LatLng;
  onChange: (value: LatLng) => void;
  height?: string;
};

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function LocationPickerMap({
  value,
  onChange,
  height = "400px",
}: LocationPickerMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    value ? [value.latitude, value.longitude] : null,
  );

  useEffect(() => {
    if (value) {
      setPosition([value.latitude, value.longitude]);
    }
  }, [value]);

  return (
    <MapContainer
      center={position ?? [20.5937, 78.9629]} // India default
      zoom={position ? 15 : 5}
      style={{ height, width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler
        onPick={(lat, lng) => {
          setPosition([lat, lng]);
          onChange({ latitude: lat, longitude: lng });
        }}
      />

      {position && <Marker position={position} />}
    </MapContainer>
  );
}
