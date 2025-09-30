"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { DataTable, type Complaint } from "~/components/ui/data-table"; // your existing table
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function UserDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    highPriority: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/complaints"); // your API
        const data: Complaint[] = await res.json();
        setComplaints(data);

        // Calculate stats
        const pending = data.filter((c) => c.status === "PENDING").length;
        const resolved = data.filter((c) => c.status === "RESOLVED").length;
        const highPriority = data.filter((c) => c.priority === "HIGH").length;
        setStats({
          total: data.length,
          pending,
          resolved,
          highPriority,
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Prepare data for chart (complaints per category)
  const categoryData = Array.from(
    complaints.reduce(
      (map, c) => map.set(c.category, (map.get(c.category) || 0) + 1),
      new Map<string, number>(),
    ),
  ).map(([category, count]) => ({ category, count }));

  // if (loading) return <Skeleton className="space-y-6 h-80 w-full space-y-6" />;

  return (
    <>
      {loading ? (
        <div className="space-y-6">
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-20 w-full animate-pulse rounded-md"
              />
            ))}
          </div>

          {/* Recent Complaints Table Skeleton */}
          <Skeleton className="h-64 w-full animate-pulse rounded-md" />

          {/* Category Chart Skeleton */}
          <Skeleton className="h-64 w-full animate-pulse rounded-md" />
        </div>
      ) : (
        <div className="space-y-6 p-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Complaints</CardTitle>
              </CardHeader>
              <CardContent>{stats.total}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending</CardTitle>
              </CardHeader>
              <CardContent>{stats.pending}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resolved</CardTitle>
              </CardHeader>
              <CardContent>{stats.resolved}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>High Priority</CardTitle>
              </CardHeader>
              <CardContent>{stats.highPriority}</CardContent>
            </Card>
          </div>

          {/* Recent Complaints Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable complaints={complaints.slice(0, 10)} />
            </CardContent>
          </Card>

          {/* Category Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
