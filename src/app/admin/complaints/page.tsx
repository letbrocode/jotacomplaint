"use client";

import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { AlertTriangle, RefreshCw, Search, Filter } from "lucide-react";
import type { Department, Role } from "@prisma/client";
import ComplaintCard from "~/components/complaint-card";
import type { ComplaintWithRelations } from "~/types/complaint";

type FilterState = {
  status: string;
  priority: string;
  category: string;
  departmentId: string;
  search: string;
};

type StaffMember = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
  isActive: boolean;
  password: string;
  role: Role;
  departments?: Department[];
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    priority: "all",
    category: "all",
    departmentId: "all",
    search: "",
  });
  const [sortBy, setSortBy] = useState<string>("newest");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [complaintsRes, staffRes, departmentsRes] = await Promise.all([
        fetch("/api/complaints"),
        fetch("/api/staff"),
        fetch("/api/departments"),
      ]);

      if (!complaintsRes.ok) throw new Error("Failed to fetch complaints");
      if (!staffRes.ok) throw new Error("Failed to fetch staff");
      if (!departmentsRes.ok) throw new Error("Failed to fetch departments");

      const complaintsData =
        (await complaintsRes.json()) as ComplaintWithRelations[];
      const staffData = (await staffRes.json()) as StaffMember[];
      const departmentsData = (await departmentsRes.json()) as Department[];

      setComplaints(complaintsData);
      setStaffList(staffData);
      setDepartments(departmentsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // Memoized filtered and sorted complaints
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // Apply filters
    if (filters.status !== "all") {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters.priority !== "all") {
      result = result.filter((c) => c.priority === filters.priority);
    }
    if (filters.category !== "all") {
      result = result.filter((c) => c.category === filters.category);
    }
    if (filters.departmentId !== "all") {
      result = result.filter(
        (c) => c.departmentId?.toString() === filters.departmentId,
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ??
          c.details.toLowerCase().includes(searchLower) ??
          c.location?.toLowerCase().includes(searchLower) ??
          c.user.name?.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "high-priority":
        result.sort((a, b) => {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (
            priorityOrder[b.priority as keyof typeof priorityOrder] -
            priorityOrder[a.priority as keyof typeof priorityOrder]
          );
        });
        break;
      case "low-priority":
        result.sort((a, b) => {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (
            priorityOrder[a.priority as keyof typeof priorityOrder] -
            priorityOrder[b.priority as keyof typeof priorityOrder]
          );
        });
        break;
    }

    return result;
  }, [complaints, filters, sortBy]);

  // Stats from filtered results
  const stats = useMemo(
    () => ({
      total: filteredComplaints.length,
      pending: filteredComplaints.filter((c) => c.status === "PENDING").length,
      inProgress: filteredComplaints.filter((c) => c.status === "IN_PROGRESS")
        .length,
      resolved: filteredComplaints.filter((c) => c.status === "RESOLVED")
        .length,
    }),
    [filteredComplaints],
  );

  // Optimistic update for complaint changes
  const handleComplaintUpdate = (updatedComplaint: ComplaintWithRelations) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c)),
    );
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      priority: "all",
      category: "all",
      departmentId: "all",
      search: "",
    });
    setSortBy("newest");
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-40" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold">Error Loading Complaints</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Complaints</h1>
          <p className="text-muted-foreground">
            View and manage all complaints registered by users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground mt-1 text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
          {(filters.status !== "all" ||
            filters.priority !== "all" ||
            filters.category !== "all" ||
            filters.departmentId !== "all" ||
            filters.search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="ml-auto"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by title, details, location, or user name..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="pl-10"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="WATER">Water</SelectItem>
              <SelectItem value="ELECTRICITY">Electricity</SelectItem>
              <SelectItem value="SANITATION">Sanitation</SelectItem>
              <SelectItem value="ROADS">Roads</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.departmentId}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, departmentId: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="high-priority">High Priority First</SelectItem>
              <SelectItem value="low-priority">Low Priority First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {(filters.status !== "all" ||
          filters.priority !== "all" ||
          filters.category !== "all" ||
          filters.departmentId !== "all") && (
          <div className="flex flex-wrap gap-2">
            {filters.status !== "all" && (
              <Badge variant="secondary">Status: {filters.status}</Badge>
            )}
            {filters.priority !== "all" && (
              <Badge variant="secondary">Priority: {filters.priority}</Badge>
            )}
            {filters.category !== "all" && (
              <Badge variant="secondary">Category: {filters.category}</Badge>
            )}
            {filters.departmentId !== "all" && (
              <Badge variant="secondary">
                Department:{" "}
                {
                  departments.find(
                    (d) => d.id.toString() === filters.departmentId,
                  )?.name
                }
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {filteredComplaints.length} of {complaints.length} complaints
        </p>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">
            No complaints found matching your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              staffList={staffList}
              onUpdate={handleComplaintUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
