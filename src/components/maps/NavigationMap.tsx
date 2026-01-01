"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import { Navigation, Loader2 } from "lucide-react";

// Dynamically import RoutingMachine to avoid SSR issues
const RoutingMachine = dynamic(() => import("./RoutingMachine"), {
  ssr: false,
});

type NavigationMapProps = {
  destinationLat: number;
  destinationLng: number;
  destinationTitle: string;
  height?: string;
};

export default function NavigationMap({
  destinationLat,
  destinationLng,
  destinationTitle,
  height = "500px",
}: NavigationMapProps) {
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    time: string;
  } | null>(null);

  const destination: [number, number] = [destinationLat, destinationLng];

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        setShowRoute(true);
        setIsGettingLocation(false);
      },
      (error) => {
        alert("Unable to get location: " + error.message);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleRoutesFound = (routes: any) => {
    if (routes && routes.length > 0) {
      const route = routes[0];
      const distanceKm = (route.summary.totalDistance / 1000).toFixed(2);
      const timeMin = Math.round(route.summary.totalTime / 60);

      setRouteInfo({
        distance: `${distanceKm} km`,
        time: `${timeMin} min`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card flex items-center justify-between rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Navigate to Complaint Location</h3>
          <p className="text-muted-foreground text-sm">{destinationTitle}</p>
          {routeInfo && (
            <p className="mt-2 text-sm">
              <span className="font-medium">Distance:</span>{" "}
              {routeInfo.distance} • <span className="font-medium">Time:</span>{" "}
              {routeInfo.time}
            </p>
          )}
        </div>
        <Button onClick={getMyLocation} disabled={isGettingLocation} size="lg">
          {isGettingLocation ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-4 w-4" />
              Start Navigation
            </>
          )}
        </Button>
      </div>

      <MapContainer
        center={destination}
        zoom={13}
        style={{ height, width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Destination Marker */}
        <Marker position={destination}>
          <Popup>
            <strong>Complaint Location</strong>
            <p className="text-sm">{destinationTitle}</p>
          </Popup>
        </Marker>

        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={L.divIcon({
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
            })}
          >
            <Popup>Your Current Location</Popup>
          </Marker>
        )}

        {/* Routing */}
        {showRoute && currentLocation && (
          <RoutingMachine
            start={currentLocation}
            end={destination}
            onRoutesFound={handleRoutesFound}
          />
        )}
      </MapContainer>
    </div>
  );
}
