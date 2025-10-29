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
} from "recharts";
import type { ComplaintWithRelations } from "~/types/complaint";
import { DataTable } from "~/components/ui/data-table";
import Link from "next/link";

// Color palette for charts
const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"];

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
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

  // Memoized chart data - OLD STYLE
  const trendData = useMemo(() => {
    const complaintsByDate = complaints.reduce(
      (acc: Record<string, number>, c) => {
        const date = new Date(c.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {},
    );

    return Object.entries(complaintsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

    return Object.entries(departmentsMap).map(([department, values]) => ({
      department,
      ...values,
    }));
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
      <div className="space-y-8">
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
        <Card className="p-12 text-center">
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

  return (
    <div className="space-y-8">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              <span className={trendColor}>
                {stats.trendPercentage.toFixed(0)}% from last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-muted-foreground text-xs">
              {stats.total > 0
                ? ((stats.pending / stats.total) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-muted-foreground text-xs">
              {stats.total > 0
                ? ((stats.inProgress / stats.total) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-muted-foreground text-xs">
              {stats.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - OLD STYLE */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Line Chart - OLD STYLE */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[300px] items-center justify-center">
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
                    label={(props: any) =>
                      `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                    }
                    labelLine={true}
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department-wise Bar Chart - OLD STYLE */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Complaints by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="In Progress"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Resolved"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Complaints</CardTitle>
            <p className="text-muted-foreground text-sm">
              Latest 5 complaints submitted
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/complaints">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable complaints={recentComplaints} />
        </CardContent>
      </Card>
    </div>
  );
}
