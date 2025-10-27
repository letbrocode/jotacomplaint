"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { DataTable, type Complaint } from "~/components/ui/data-table";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const res = await fetch("/api/complaints");
        if (!res.ok) throw new Error("Failed to fetch complaints");
        const data: Complaint[] = await res.json();
        setComplaints(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaints();
  }, []);

  if (loading) return <DashboardSkeleton />;

  // Simple stats
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "PENDING").length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Overview of all registered complaints and their status.
      </p>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Total Complaints</CardTitle>
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending</CardTitle>
            <Clock className="h-6 w-6 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resolved</CardTitle>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Complaints table */}
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold">Recent Complaints</h2>
        <DataTable complaints={complaints} />
      </div>
    </div>
  );
}
