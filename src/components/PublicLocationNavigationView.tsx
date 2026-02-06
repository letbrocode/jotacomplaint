"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
  MapPin,
  Navigation,
  ExternalLink,
  Trash2,
  Recycle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const SimpleMap = dynamic(() => import("~/components/maps/SimpleMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted flex h-[400px] w-full items-center justify-center rounded-lg">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  ),
});

type PublicLocationNavigationViewProps = {
  destinationLat: number;
  destinationLng: number;
  destinationTitle: string;
  destinationType: string;
  destinationDescription?: string;
};

export default function PublicLocationNavigationView({
  destinationLat,
  destinationLng,
  destinationTitle,
  destinationType,
  destinationDescription,
}: PublicLocationNavigationViewProps) {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(current);

        const dist = calculateDistance(
          current.lat,
          current.lng,
          destinationLat,
          destinationLng,
        );
        setDistance(dist);

        setIsGettingLocation(false);
      },
      (error) => {
        alert(`Unable to get location: ${error.message}`);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): string => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} meters`;
    }
    return `${distanceKm.toFixed(2)} km`;
  };

  const openInGoogleMaps = () => {
    if (currentLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
      window.open(url, "_blank");
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${destinationLat},${destinationLng}`;
      window.open(url, "_blank");
    }
  };

  const openInWaze = () => {
    const url = `https://www.waze.com/ul?ll=${destinationLat},${destinationLng}&navigate=yes&zoom=17`;
    window.open(url, "_blank");
  };

  const openInAppleMaps = () => {
    if (currentLocation) {
      const url = `http://maps.apple.com/?saddr=${currentLocation.lat},${currentLocation.lng}&daddr=${destinationLat},${destinationLng}`;
      window.open(url, "_blank");
    } else {
      const url = `http://maps.apple.com/?ll=${destinationLat},${destinationLng}`;
      window.open(url, "_blank");
    }
  };

  const getLocationTypeInfo = (type: string) => {
    const typeMap: Record<
      string,
      { icon: React.ReactNode; color: string; label: string }
    > = {
      GARBAGE_BIN: {
        icon: <Trash2 className="h-4 w-4" />,
        color: "bg-green-100 text-green-800",
        label: "Garbage Bin",
      },
      DUMP_YARD: {
        icon: <Trash2 className="h-4 w-4" />,
        color: "bg-orange-100 text-orange-800",
        label: "Dump Yard",
      },
      RECYCLING_CENTER: {
        icon: <Recycle className="h-4 w-4" />,
        color: "bg-blue-100 text-blue-800",
        label: "Recycling Center",
      },
      COLLECTION_CENTER: {
        icon: <MapPin className="h-4 w-4" />,
        color: "bg-purple-100 text-purple-800",
        label: "Collection Center",
      },
      WATER_TREATMENT: {
        icon: <MapPin className="h-4 w-4" />,
        color: "bg-cyan-100 text-cyan-800",
        label: "Water Treatment",
      },
      ELECTRICAL_SUBSTATION: {
        icon: <MapPin className="h-4 w-4" />,
        color: "bg-yellow-100 text-yellow-800",
        label: "Electrical Substation",
      },
    };
    return (
      typeMap[type] || {
        icon: <MapPin className="h-4 w-4" />,
        color: "bg-gray-100 text-gray-800",
        label: type.replace(/_/g, " "),
      }
    );
  };

  const typeInfo = getLocationTypeInfo(destinationType);

  return (
    <div className="space-y-4">
      {/* Destination Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="text-primary h-5 w-5" />
                  {destinationTitle}
                </CardTitle>
                <Badge variant="secondary" className={typeInfo.color}>
                  {typeInfo.icon}
                  <span className="ml-1">{typeInfo.label}</span>
                </Badge>
              </div>
              {destinationDescription && (
                <CardDescription className="mt-2">
                  {destinationDescription}
                </CardDescription>
              )}
              <div className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">
                  Lat: {destinationLat.toFixed(6)}
                </Badge>
                <Badge variant="outline">
                  Lng: {destinationLng.toFixed(6)}
                </Badge>
                {distance && (
                  <Badge
                    variant="secondary"
                    className="bg-green-500 text-white"
                  >
                    Distance: {distance}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentLocation ? (
            <div className="space-y-2">
              <div className="rounded-lg bg-green-500/10 p-3 text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">
                  ✓ Location acquired
                </p>
                <p className="text-muted-foreground text-xs">
                  {currentLocation.lat.toFixed(6)},{" "}
                  {currentLocation.lng.toFixed(6)}
                </p>
              </div>
              <Button
                onClick={getCurrentLocation}
                variant="outline"
                size="sm"
                disabled={isGettingLocation}
                className="w-full"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-4 w-4" />
                    Update Location
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  Get My Location
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Navigation Options Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Start Navigation</CardTitle>
          <CardDescription>
            Choose your preferred navigation app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={openInGoogleMaps}
            className="w-full justify-start bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <svg
              className="mr-3 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Open in Google Maps
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>

          <Button
            onClick={openInWaze}
            className="w-full justify-start bg-cyan-500 hover:bg-cyan-600"
            size="lg"
          >
            <svg
              className="mr-3 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
            </svg>
            Open in Waze
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>

          <Button
            onClick={openInAppleMaps}
            variant="outline"
            className="w-full justify-start"
            size="lg"
          >
            <svg
              className="mr-3 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Open in Apple Maps
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Map Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location Preview</CardTitle>
        </CardHeader>
        <CardContent className="relative z-0 p-0">
          <SimpleMap
            latitude={destinationLat}
            longitude={destinationLng}
            title={destinationTitle}
            description={destinationDescription}
            currentLocation={currentLocation}
            height="400px"
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          {typeInfo.icon}
          <div className="space-y-1">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              {typeInfo.label} Location
            </p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>• Click &quot;Get My Location&quot; to calculate distance</li>
              <li>• Choose your preferred navigation app for directions</li>
              <li>• Make sure location services are enabled</li>
              <li>• This facility is part of the municipal infrastructure</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
