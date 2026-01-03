"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Users,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import type { ComplaintWithRelations } from "~/types/complaint";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Color palette for charts - matches your UI theme
const COLORS = {
  pending: "#f59e0b",
  inProgress: "#3b82f6",
  resolved: "#10b981",
  rejected: "#ef4444",
};

const CHART_COLORS = [COLORS.pending, COLORS.inProgress, COLORS.resolved];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Skeleton className="h-[400px] lg:col-span-4" />
        <Skeleton className="h-[400px] lg:col-span-3" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/complaints");

      if (!res.ok) {
        throw new Error(`Failed to fetch complaints: ${res.status}`);
      }

      const data: ComplaintWithRelations[] = await res.json();
      setComplaints(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setError("Failed to load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Memoized statistics with trends
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === "PENDING").length;
    const inProgress = complaints.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED").length;

    // Calculate this week vs last week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = complaints.filter(
      (c) => new Date(c.createdAt) >= weekAgo,
    ).length;
    const lastWeek = complaints.filter(
      (c) =>
        new Date(c.createdAt) >= twoWeeksAgo && new Date(c.createdAt) < weekAgo,
    ).length;

    const trend =
      lastWeek === 0
        ? "neutral"
        : thisWeek > lastWeek
          ? "up"
          : thisWeek < lastWeek
            ? "down"
            : "neutral";

    const trendPercentage =
      lastWeek === 0 ? 0 : Math.abs(((thisWeek - lastWeek) / lastWeek) * 100);

    return {
      total,
      pending,
      inProgress,
      resolved,
      completionRate: total > 0 ? (resolved / total) * 100 : 0,
      trend,
      trendPercentage,
      thisWeek,
    };
  }, [complaints]);

  // Chart data - Group by date and sort chronologically
  const trendData = useMemo(() => {
    if (complaints.length === 0) return [];

    const complaintsByDate: Record<string, number> = {};

    complaints.forEach((c) => {
      const date = new Date(c.createdAt);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format
      if (dateKey) {
        complaintsByDate[dateKey] = (complaintsByDate[dateKey] || 0) + 1;
      }
    });

    // Convert to array and sort by date
    const sortedData = Object.entries(complaintsByDate)
      .map(([dateStr, count]) => {
        const date = new Date(dateStr);
        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: dateStr,
          count,
        };
      })
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    // Return last 30 data points
    return sortedData.slice(-30);
  }, [complaints]);

  const statusData = useMemo(() => {
    return [
      { name: "Pending", value: stats.pending },
      { name: "In Progress", value: stats.inProgress },
      { name: "Resolved", value: stats.resolved },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const departmentData = useMemo(() => {
    const departmentsMap: Record<
      string,
      { Pending: number; "In Progress": number; Resolved: number }
    > = {};

    complaints.forEach((c) => {
      const dept = c.department?.name || "Unassigned";
      if (!departmentsMap[dept]) {
        departmentsMap[dept] = { Pending: 0, "In Progress": 0, Resolved: 0 };
      }

      if (c.status === "PENDING") departmentsMap[dept].Pending++;
      if (c.status === "IN_PROGRESS") departmentsMap[dept]["In Progress"]++;
      if (c.status === "RESOLVED") departmentsMap[dept].Resolved++;
    });

    return Object.entries(departmentsMap)
      .map(([department, values]) => ({
        department:
          department.length > 15 ? department.slice(0, 15) + "..." : department,
        ...values,
      }))
      .slice(0, 6); // Show top 6 departments
  }, [complaints]);

  const recentComplaints = useMemo(() => complaints.slice(0, 5), [complaints]);

  if (loading) return <DashboardSkeleton />;

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

  if (complaints.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome to your complaint management system
            </p>
          </div>
          <Button onClick={fetchComplaints} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Card className="border-dashed p-12 text-center">
          <BarChart3 className="text-muted-foreground/50 mx-auto h-20 w-20" />
          <h3 className="mt-6 text-xl font-semibold">No complaints yet</h3>
          <p className="text-muted-foreground mt-2">
            Complaints will appear here once users submit them.
          </p>
        </Card>
      </div>
    );
  }

  const TrendIcon =
    stats.trend === "up"
      ? TrendingUp
      : stats.trend === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    stats.trend === "up"
      ? "text-red-600"
      : stats.trend === "down"
        ? "text-green-600"
        : "text-muted-foreground";

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-amber-600";
      case "LOW":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
      case "RESOLVED":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your complaint management system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              <span className={trendColor}>
                {stats.trendPercentage.toFixed(0)}%
              </span>
              <span>from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-950">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-muted-foreground text-xs">
              {stats.total > 0
                ? ((stats.pending / stats.total) * 100).toFixed(1)
                : 0}
              % of total complaints
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950">
              <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-muted-foreground text-xs">
              {stats.total > 0
                ? ((stats.inProgress / stats.total) * 100).toFixed(1)
                : 0}
              % currently active
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-muted-foreground text-xs">
              {stats.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Line Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Complaints Trend</CardTitle>
            <p className="text-muted-foreground text-sm">
              Daily complaint submissions over time ({trendData.length} days)
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  No trend data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <p className="text-muted-foreground text-sm">
              Current complaint status breakdown
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(props: any) => `${props.name}: ${props.value}`}
                      labelLine={true}
                    >
                      {statusData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground">
                  No status data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Complaints by Department</CardTitle>
              <p className="text-muted-foreground text-sm">
                Status breakdown for each department
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/departments">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="Pending"
                    fill={COLORS.pending}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="In Progress"
                    fill={COLORS.inProgress}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Resolved"
                    fill={COLORS.resolved}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                No department data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Complaints</CardTitle>
            <p className="text-muted-foreground text-sm">
              Latest complaints submitted to the system
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/complaints">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentComplaints.length > 0 ? (
            <div className="space-y-3">
              {recentComplaints.map((complaint) => (
                <Link
                  key={complaint.id}
                  href={`/admin/complaints/${complaint.id}`}
                  className="hover:bg-muted/50 block rounded-lg border p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{complaint.title}</h3>
                        <Badge
                          variant="outline"
                          className={getStatusColor(complaint.status)}
                        >
                          {complaint.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground line-clamp-1 text-sm">
                        {complaint.details}
                      </p>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {complaint.user.name || "Unknown"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {complaint.department?.name || "Unassigned"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(
                            new Date(complaint.createdAt),
                          )}{" "}
                          ago
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="secondary"
                        className={getPriorityColor(complaint.priority)}
                      >
                        {complaint.priority}
                      </Badge>
                      <ArrowRight className="text-muted-foreground h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">
              No recent complaints
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
