"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Navigation, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Badge } from "~/components/ui/badge";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Dynamically import RoutingMachine
const RoutingMachine = dynamic(() => import("./RoutingMachine"), {
  ssr: false,
});

// Custom current location icon
const currentLocationIcon = L.divIcon({
  className: "current-location-marker",
  html: `
    <div style="
      background-color: #3b82f6;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
      animation: pulse 2s infinite;
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

type NavigationMapProps = {
  destinationLat: number;
  destinationLng: number;
  destinationTitle: string;
  destinationAddress?: string;
  height?: string;
};

export default function NavigationMap({
  destinationLat,
  destinationLng,
  destinationTitle,
  destinationAddress,
  height = "600px",
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
  const [error, setError] = useState<string | null>(null);

  const destination: [number, number] = [destinationLat, destinationLng];

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setError(null);

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
        setError(`Unable to get location: ${error.message}`);
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
      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>Navigate to Complaint Location</CardTitle>
              <CardDescription className="mt-1">
                {destinationTitle}
              </CardDescription>
              {destinationAddress && (
                <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {destinationAddress}
                </div>
              )}
            </div>
            <Button
              onClick={getMyLocation}
              disabled={isGettingLocation}
              size="lg"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  {currentLocation ? "Update Location" : "Start Navigation"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Route Info */}
        {routeInfo && (
          <CardContent>
            <div className="flex gap-4">
              <Badge variant="secondary" className="text-base">
                Distance: {routeInfo.distance}
              </Badge>
              <Badge variant="secondary" className="text-base">
                Time: {routeInfo.time}
              </Badge>
            </div>
          </CardContent>
        )}

        {/* Error Message */}
        {error && (
          <CardContent>
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="relative z-0 p-0">
          <MapContainer
            center={destination}
            zoom={13}
            style={{ height, width: "100%", borderRadius: "0.5rem" }}
            scrollWheelZoom
            zoomControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Destination Marker */}
            <Marker position={destination}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">Complaint Location</p>
                  <p className="text-sm">{destinationTitle}</p>
                  {destinationAddress && (
                    <p className="text-muted-foreground text-xs">
                      {destinationAddress}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Current Location Marker */}
            {currentLocation && (
              <Marker position={currentLocation} icon={currentLocationIcon}>
                <Popup>
                  <p className="font-semibold">Your Current Location</p>
                </Popup>
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
        </CardContent>
      </Card>

      {/* Instructions */}
      {!currentLocation && (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-3 p-4 text-sm">
            <AlertCircle className="h-5 w-5" />
            <p>
              Click "Start Navigation" to enable GPS and get turn-by-turn
              directions to the complaint location.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
