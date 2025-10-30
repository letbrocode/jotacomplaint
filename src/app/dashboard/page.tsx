"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  TrendingUp,
  FileText,
  MessageSquare,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { ComplaintWithRelations } from "~/types/complaint";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981"];

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
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
        throw new Error("Failed to fetch complaints");
      }

      const data: ComplaintWithRelations[] = await res.json();
      setComplaints(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("Failed to load your complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Memoized statistics
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === "PENDING").length;
    const inProgress = complaints.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
    const highPriority = complaints.filter((c) => c.priority === "HIGH").length;

    return {
      total,
      pending,
      inProgress,
      resolved,
      highPriority,
      completionRate: total > 0 ? (resolved / total) * 100 : 0,
    };
  }, [complaints]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    return [
      { name: "Pending", value: stats.pending },
      { name: "In Progress", value: stats.inProgress },
      { name: "Resolved", value: stats.resolved },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Category distribution for bar chart
  const categoryData = useMemo(() => {
    const categoryMap = complaints.reduce(
      (acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));
  }, [complaints]);

  // Recent complaints (last 5)
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}!
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of your complaints
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
          <Button asChild>
            <Link href="/dashboard/new-complaint">
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Link>
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
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">
              All your submitted complaints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
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
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-muted-foreground text-xs">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
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
      {complaints.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <p className="text-muted-foreground text-sm">
                Distribution of your complaint statuses
              </p>
            </CardHeader>
            <CardContent className="h-[280px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Category</CardTitle>
              <p className="text-muted-foreground text-sm">
                Types of issues you've reported
              </p>
            </CardHeader>
            <CardContent className="h-[280px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis
                      dataKey="category"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Recent Complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Complaints</CardTitle>
            <p className="text-muted-foreground text-sm">
              Your latest complaint submissions
            </p>
          </div>
          {complaints.length > 5 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/complaints">View All</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="text-muted-foreground mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 text-lg font-semibold">No complaints yet</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Get started by submitting your first complaint
              </p>
              <Button asChild>
                <Link href="/dashboard/new-complaint">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Complaint
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{complaint.title}</p>
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
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4 text-xs">
                      <span>{complaint.category}</span>
                      <span>•</span>
                      <span>
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                      {complaint._count?.comments !== undefined && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {complaint._count.comments}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/complaints/${complaint.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
