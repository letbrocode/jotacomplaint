"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const StaffComplaintsMap = dynamic(
  () => import("~/components/maps/StaffComplaintsMap"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted flex h-[600px] w-full items-center justify-center rounded-lg">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    ),
  },
);

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

export default function StaffMapView({
  complaints,
}: {
  complaints: Complaint[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Assigned Complaints</CardTitle>
        <CardDescription>
          {complaints.length} complaint{complaints.length !== 1 ? "s" : ""} with
          location data
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-0">
        <StaffComplaintsMap
          complaints={complaints}
          onComplaintClick={(complaint) => {
            window.location.href = `/staff/complaints/${complaint.id}`;
          }}
          height="600px"
        />
      </CardContent>
    </Card>
  );
}
