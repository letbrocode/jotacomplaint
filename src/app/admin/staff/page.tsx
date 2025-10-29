"use client";

import { useEffect, useState } from "react";
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
import {
  Plus,
  RefreshCw,
  AlertTriangle,
  Users,
  Shield,
  Search,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import type { User, Department } from "@prisma/client";
import StaffCard from "~/components/staff-card";
import StaffDialog from "~/components/staff-dialog";

type StaffWithRelations = User & {
  departments?: Department[];
  _count?: {
    assignedComplaints?: number;
  };
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffWithRelations[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffWithRelations | null>(
    null,
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [staffRes, deptRes] = await Promise.all([
        fetch("/api/staff/all"),
        fetch("/api/departments"),
      ]);

      if (!staffRes.ok) throw new Error("Failed to fetch staff");
      if (!deptRes.ok) throw new Error("Failed to fetch departments");

      const staffData = await staffRes.json();
      const deptData = await deptRes.json();

      setStaff(staffData);
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

  const handleCreate = () => {
    setEditingStaff(null);
    setDialogOpen(true);
  };

  const handleEdit = (staffMember: StaffWithRelations) => {
    setEditingStaff(staffMember);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this staff member? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete staff member");
      }

      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Failed to delete staff member",
      );
    }
  };

  const handleSave = (staffMember: StaffWithRelations) => {
    setStaff((prev) => {
      const index = prev.findIndex((s) => s.id === staffMember.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = staffMember;
        return updated;
      } else {
        return [...prev, staffMember];
      }
    });
    setDialogOpen(false);
  };

  // Filter staff
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      searchTerm === "" ||
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    const matchesDepartment =
      departmentFilter === "all" ||
      member.departments?.some((d) => d.id.toString() === departmentFilter);

    return matchesSearch && matchesRole && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-40" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
        <h2 className="text-2xl font-bold">Error Loading Staff</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const stats = {
    total: staff.length,
    admin: staff.filter((s) => s.role === "ADMIN").length,
    staffRole: staff.filter((s) => s.role === "STAFF").length,
    active: staff.filter((s) => s.isActive).length,
    totalAssignments: staff.reduce(
      (sum, s) => sum + (s._count?.assignedComplaints || 0),
      0,
    ),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage staff members and their department assignments
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
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admin}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staffRole}</div>
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
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
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
          </div>

          {/* Active Filters */}
          {(searchTerm ||
            roleFilter !== "all" ||
            departmentFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Active filters:
              </span>
              {searchTerm && (
                <Badge variant="secondary">Search: {searchTerm}</Badge>
              )}
              {roleFilter !== "all" && (
                <Badge variant="secondary">Role: {roleFilter}</Badge>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                  setDepartmentFilter("all");
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {filteredStaff.length} of {staff.length} staff members
        </p>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-20" />
          <h3 className="mb-2 text-lg font-semibold">
            {staff.length === 0 ? "No Staff Yet" : "No Results Found"}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {staff.length === 0
              ? "Get started by adding your first staff member."
              : "Try adjusting your filters."}
          </p>
          {staff.length === 0 && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={editingStaff}
        departments={departments}
        onSave={handleSave}
      />
    </div>
  );
}
