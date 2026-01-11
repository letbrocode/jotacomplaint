"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin, Filter, LayoutGrid } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useRouter } from "next/navigation";
import AddLocationDialog from "./AddLocationDialog";

// Dynamic import to avoid SSR issues
const AdminComplaintsMap = dynamic(
  () => import("~/components/maps/AdminComplaintsMap"),
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

type PredefinedLocation = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  description?: string | null;
};

type MapViewProps = {
  complaints: Complaint[];
  predefinedLocations: PredefinedLocation[];
  userRole?: "ADMIN" | "STAFF" | "USER";
};

export default function MapView({
  complaints,
  predefinedLocations,
  userRole = "ADMIN",
}: MapViewProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showPredefined, setShowPredefined] = useState(true);

  // Convert null to undefined for the component
  const normalizedComplaints = complaints.map((c) => ({
    ...c,
    location: c.location ?? undefined,
  }));

  const normalizedLocations = predefinedLocations.map((l) => ({
    ...l,
    address: l.address ?? undefined,
    description: l.description ?? undefined,
  }));

  // Apply filters
  const filteredComplaints = normalizedComplaints.filter((complaint) => {
    if (statusFilter !== "ALL" && complaint.status !== statusFilter)
      return false;
    if (priorityFilter !== "ALL" && complaint.priority !== priorityFilter)
      return false;
    if (categoryFilter !== "ALL" && complaint.category !== categoryFilter)
      return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "PENDING").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
    highPriority: complaints.filter((c) => c.priority === "HIGH").length,
  };

  const handleLocationAdded = () => {
    // Refresh the page to show the new location
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Complaints</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-amber-500">
              {stats.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-500">
              {stats.inProgress}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {stats.resolved}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>High Priority</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {stats.highPriority}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Map View
              </CardTitle>
              <CardDescription>
                {filteredComplaints.length} complaint
                {filteredComplaints.length !== 1 ? "s" : ""} •{" "}
                {predefinedLocations.length} public location
                {predefinedLocations.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            {userRole === "ADMIN" && (
              <AddLocationDialog onSuccess={handleLocationAdded} />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priority</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="ROADS">Roads</SelectItem>
                <SelectItem value="WATER">Water</SelectItem>
                <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                <SelectItem value="SANITATION">Sanitation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showPredefined ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPredefined(!showPredefined)}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              {showPredefined ? "Hide" : "Show"} Facilities
            </Button>

            {(statusFilter !== "ALL" ||
              priorityFilter !== "ALL" ||
              categoryFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("ALL");
                  setPriorityFilter("ALL");
                  setCategoryFilter("ALL");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Map */}
          <div className="relative z-0">
            <AdminComplaintsMap
              complaints={filteredComplaints}
              predefinedLocations={normalizedLocations}
              height="600px"
              showPredefined={showPredefined}
              userRole={userRole}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
