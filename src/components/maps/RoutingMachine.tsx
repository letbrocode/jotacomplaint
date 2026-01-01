"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

type RoutingMachineProps = {
  start: [number, number];
  end: [number, number];
  onRoutesFound?: (routes: any) => void;
};

export default function RoutingMachine({
  start,
  end,
  onRoutesFound,
}: RoutingMachineProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [
          {
            color: "#3b82f6",
            opacity: 0.8,
            weight: 6,
          },
        ],
      },
      createMarker: function () {
        return null; // Hide default markers
      },
    } as any).addTo(map); // Type assertion here

    if (onRoutesFound) {
      routingControl.on("routesfound", (e: any) => {
        onRoutesFound(e.routes);
      });
    }

    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, start, end, onRoutesFound]);

  return null;
}
