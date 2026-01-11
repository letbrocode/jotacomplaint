"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Plus, RefreshCw, AlertTriangle, Users, Building2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import type { Department } from "@prisma/client";
import DepartmentDialog from "~/components/department-dialog";
import DepartmentCard from "~/components/department-card";

type DepartmentWithStats = Department & {
  _count?: {
    complaints?: number;
    staff?: number;
  };
};

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentWithStats | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/departments/all");
      if (!res.ok) throw new Error("Failed to fetch departments");

      const data = (await res.json()) as DepartmentWithStats[];
      setDepartments(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load departments",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDepartments();
  }, []);

  const handleCreate = () => {
    setEditingDepartment(null);
    setDialogOpen(true);
  };

  const handleEdit = (department: DepartmentWithStats) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this department? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error ?? "Failed to delete department");
      }

      // Remove from state
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete department");
    }
  };

  const handleSave = (department: DepartmentWithStats) => {
    // Update or add department in state
    setDepartments((prev) => {
      const index = prev.findIndex((d) => d.id === department.id);
      if (index >= 0) {
        // Update existing
        const updated = [...prev];
        updated[index] = department;
        return updated;
      } else {
        // Add new
        return [...prev, department];
      }
    });
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold">Error Loading Departments</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={fetchDepartments}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const stats = {
    total: departments.length,
    active: departments.filter((d) => d.isActive).length,
    inactive: departments.filter((d) => !d.isActive).length,
    totalComplaints: departments.reduce(
      (sum, d) => sum + (d._count?.complaints ?? 0),
      0,
    ),
    totalStaff: departments.reduce((sum, d) => sum + (d._count?.staff ?? 0), 0),
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage municipal departments and their staff
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground mt-1 text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <Button
            onClick={fetchDepartments}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Badge
              variant="outline"
              className="border-green-500/20 bg-green-500/10 text-green-600"
            >
              Active
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Badge
              variant="outline"
              className="border-gray-500/20 bg-gray-500/10 text-gray-600"
            >
              Inactive
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComplaints}</div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-20" />
          <h3 className="mb-2 text-lg font-semibold">No Departments Yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Get started by creating your first department.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editingDepartment}
        onSave={handleSave}
      />
    </div>
  );
}
