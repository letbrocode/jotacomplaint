"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const NavigationMap = dynamic(() => import("~/components/maps/NavigationMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted flex h-[600px] w-full items-center justify-center rounded-lg">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  ),
});

type NavigationViewProps = {
  destinationLat: number;
  destinationLng: number;
  destinationTitle: string;
  destinationAddress?: string;
};

export default function NavigationView({
  destinationLat,
  destinationLng,
  destinationTitle,
  destinationAddress,
}: NavigationViewProps) {
  return (
    <NavigationMap
      destinationLat={destinationLat}
      destinationLng={destinationLng}
      destinationTitle={destinationTitle}
      destinationAddress={destinationAddress}
      height="calc(100vh - 200px)"
    />
  );
}
