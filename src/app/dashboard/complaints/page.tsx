"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileText,
  MessageSquare,
  Calendar,
} from "lucide-react";
import type { ComplaintWithRelations } from "~/types/complaint";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

export default function ComplaintsPage() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/complaints");

      if (!res.ok) {
        throw new Error("Failed to fetch complaints");
      }

      const data: ComplaintWithRelations[] = await res.json();
      setComplaints(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter and sort complaints
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.details.toLowerCase().includes(searchLower) ||
          c.location?.toLowerCase().includes(searchLower),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // Sorting
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
      case "priority":
        result.sort((a, b) => {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (
            priorityOrder[b.priority as keyof typeof priorityOrder] -
            priorityOrder[a.priority as keyof typeof priorityOrder]
          );
        });
        break;
    }

    return result;
  }, [complaints, searchTerm, statusFilter, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "PENDING").length,
      inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: complaints.filter((c) => c.status === "RESOLVED").length,
    };
  }, [complaints]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortBy("newest");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <DataTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <AlertTriangle className="text-destructive h-16 w-16" />
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={fetchComplaints}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Complaints</h2>
          <p className="text-muted-foreground">
            View and track all your submitted complaints
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchComplaints}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/register">
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge className="bg-yellow-500">{stats.pending}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Badge className="bg-blue-500">{stats.inProgress}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Badge className="bg-green-500">{stats.resolved}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <h3 className="font-semibold">Filters</h3>
              {(searchTerm ||
                statusFilter !== "all" ||
                categoryFilter !== "all" ||
                sortBy !== "newest") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="ml-auto"
                >
                  Reset
                </Button>
              )}
            </div>

            <div className="flex gap-2 md:grid-cols-4">
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

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
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

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="priority">High Priority First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {filteredComplaints.length} of {complaints.length} complaints
        </p>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-20" />
          <h3 className="mb-2 text-lg font-semibold">
            {complaints.length === 0 ? "No complaints yet" : "No results found"}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {complaints.length === 0
              ? "Submit your first complaint to get started"
              : "Try adjusting your filters"}
          </p>
          {complaints.length === 0 && (
            <Button asChild>
              <Link href="/dashboard/register">
                <Plus className="mr-2 h-4 w-4" />
                Submit Complaint
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <h3 className="flex-1 font-semibold">
                        {complaint.title}
                      </h3>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className={
                            complaint.status === "RESOLVED"
                              ? "border-green-500/20 bg-green-500/10 text-green-600"
                              : complaint.status === "IN_PROGRESS"
                                ? "border-blue-500/20 bg-blue-500/10 text-blue-600"
                                : "border-yellow-500/20 bg-yellow-500/10 text-yellow-600"
                          }
                        >
                          {complaint.status.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            complaint.priority === "HIGH"
                              ? "border-red-500/20 bg-red-500/10 text-red-600"
                              : complaint.priority === "MEDIUM"
                                ? "border-orange-500/20 bg-orange-500/10 text-orange-600"
                                : "border-blue-500/20 bg-blue-500/10 text-blue-600"
                          }
                        >
                          {complaint.priority}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {complaint.details}
                    </p>

                    <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(complaint.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>•</span>
                      <span>{complaint.category}</span>
                      {complaint._count?.comments !== undefined && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {complaint._count.comments}
                          </span>
                        </>
                      )}
                      {complaint.department && (
                        <>
                          <span>•</span>
                          <span>{complaint.department.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/complaints/${complaint.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
