"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Search,
  Calendar,
  TrendingUp,
  Clock,
  Filter,
} from "lucide-react";
import type { Complaint, User, Department } from "@prisma/client";
import ResolvedComplaintCard from "~/components/resolved-complaint-card";
import ResolutionAnalytics from "~/components/resolution-analytics";

type ResolvedComplaintWithRelations = Complaint & {
  user: User;
  department: Department | null;
  assignedTo?: User | null;
  _count?: {
    comments?: number;
  };
};

export default function ResolvedComplaintsPage() {
  const [complaints, setComplaints] = useState<
    ResolvedComplaintWithRelations[]
  >([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [complaintsRes, deptRes] = await Promise.all([
        fetch("/api/complaints/resolved"),
        fetch("/api/departments"),
      ]);

      if (!complaintsRes.ok)
        throw new Error("Failed to fetch resolved complaints");
      if (!deptRes.ok) throw new Error("Failed to fetch departments");

      const complaintsData = await complaintsRes.json();
      const deptData = await deptRes.json();

      setComplaints(complaintsData);
      setDepartments(deptData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.details.toLowerCase().includes(searchLower) ||
          c.location?.toLowerCase().includes(searchLower) ||
          c.user.name?.toLowerCase().includes(searchLower),
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      result = result.filter(
        (c) => c.departmentId?.toString() === departmentFilter,
      );
    }

    // Time range filter
    if (timeRangeFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (timeRangeFilter) {
        case "today":
          filterDate.setDate(now.getDate() - 1);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      result = result.filter(
        (c) => c.resolvedAt && new Date(c.resolvedAt) >= filterDate,
      );
    }

    return result;
  }, [
    complaints,
    searchTerm,
    categoryFilter,
    departmentFilter,
    timeRangeFilter,
  ]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredComplaints.length;

    // Average resolution time
    const resolutionTimes = filteredComplaints
      .filter((c) => c.resolvedAt)
      .map((c) => {
        const created = new Date(c.createdAt).getTime();
        const resolved = new Date(c.resolvedAt!).getTime();
        return (resolved - created) / (1000 * 60 * 60 * 24); // Convert to days
      });

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    // Category breakdown
    const byCategory = filteredComplaints.reduce(
      (acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Priority breakdown
    const byPriority = filteredComplaints.reduce(
      (acc, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Resolved this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const resolvedThisWeek = filteredComplaints.filter(
      (c) => c.resolvedAt && new Date(c.resolvedAt) >= weekAgo,
    ).length;

    return {
      total,
      avgResolutionTime,
      resolvedThisWeek,
      byCategory,
      byPriority,
    };
  }, [filteredComplaints]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setDepartmentFilter("all");
    setTimeRangeFilter("all");
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold">
          Error Loading Resolved Complaints
        </h2>
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
          <h1 className="text-3xl font-bold tracking-tight">
            Resolved Complaints
          </h1>
          <p className="text-muted-foreground">
            View and analyze completed complaint resolutions
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Resolved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">
              All time resolutions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedThisWeek}</div>
            <p className="text-muted-foreground text-xs">
              Resolved in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Resolution Time
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgResolutionTime.toFixed(1)}
            </div>
            <p className="text-muted-foreground text-xs">Days to resolve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byPriority.HIGH || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Urgent cases resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Resolutions by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <Badge key={category} variant="secondary" className="text-sm">
                {category}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Resolution Analytics Chart */}
      <ResolutionAnalytics complaints={filteredComplaints} />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <h3 className="font-semibold">Filters</h3>
              {(searchTerm ||
                categoryFilter !== "all" ||
                departmentFilter !== "all" ||
                timeRangeFilter !== "all") && (
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

            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

              {/* Department Filter */}
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
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

              {/* Time Range Filter */}
              <Select
                value={timeRangeFilter}
                onValueChange={setTimeRangeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {(searchTerm ||
              categoryFilter !== "all" ||
              departmentFilter !== "all" ||
              timeRangeFilter !== "all") && (
              <div className="flex flex-wrap gap-2">
                <span className="text-muted-foreground text-sm">
                  Active filters:
                </span>
                {searchTerm && (
                  <Badge variant="secondary">Search: {searchTerm}</Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="secondary">Category: {categoryFilter}</Badge>
                )}
                {departmentFilter !== "all" && (
                  <Badge variant="secondary">
                    Dept:{" "}
                    {
                      departments.find(
                        (d) => d.id.toString() === departmentFilter,
                      )?.name
                    }
                  </Badge>
                )}
                {timeRangeFilter !== "all" && (
                  <Badge variant="secondary">Time: {timeRangeFilter}</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {filteredComplaints.length} of {complaints.length} resolved
          complaints
        </p>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-20" />
          <h3 className="mb-2 text-lg font-semibold">
            {complaints.length === 0
              ? "No Resolved Complaints Yet"
              : "No Results Found"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {complaints.length === 0
              ? "Resolved complaints will appear here."
              : "Try adjusting your filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <ResolvedComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
}
