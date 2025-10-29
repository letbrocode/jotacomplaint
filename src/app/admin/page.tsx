"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
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

// Color palette for charts
const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[400px] w-full lg:col-span-2" />
      </div>
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

  // Memoized statistics
  const stats = useMemo(
    () => ({
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "PENDING").length,
      inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: complaints.filter((c) => c.status === "RESOLVED").length,
    }),
    [complaints],
  );

  // Memoized chart data - Trend line
  const trendData = useMemo(() => {
    const complaintsByDate = complaints.reduce(
      (acc: Record<string, number>, c) => {
        const date = new Date(c.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {},
    );

    // Sort by date
    return Object.entries(complaintsByDate)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [complaints]);

  // Memoized chart data - Status distribution (fixed to exclude Total)
  const statusData = useMemo(() => {
    return [
      { name: "Pending", value: stats.pending },
      { name: "In Progress", value: stats.inProgress },
      { name: "Resolved", value: stats.resolved },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Memoized chart data - Department-wise
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

  // Loading state
  if (loading) return <DashboardSkeleton />;

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={fetchComplaints} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (complaints.length === 0) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor complaints, track performance, and identify trends.
            </p>
          </div>
          <Button
            onClick={fetchComplaints}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Card className="p-12 text-center">
          <BarChart3 className="text-muted-foreground mx-auto h-16 w-16" />
          <h3 className="mt-4 text-lg font-semibold">No complaints yet</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Complaints will appear here once users submit them.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor complaints, track performance, and identify trends.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button
          onClick={fetchComplaints}
          variant="outline"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="transition hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              All submitted complaints
            </p>
          </CardContent>
        </Card>

        <Card className="transition hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pending}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card className="transition hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.resolved}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.total > 0
                ? `${((stats.resolved / stats.total) * 100).toFixed(1)}% completion rate`
                : "No data yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Line Chart */}
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

        {/* Department-wise Bar Chart */}
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

      {/* Complaints Table */}
      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-semibold">Recent Complaints</h2>
        <DataTable complaints={complaints} />
      </div>
    </div>
  );
}
