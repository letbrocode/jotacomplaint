"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  User,
  Mail,
  Shield,
  Building2,
  AlertTriangle,
  Edit,
  Trash2,
} from "lucide-react";
import type { User as PrismaUser, Department } from "@prisma/client";

type StaffWithRelations = PrismaUser & {
  departments?: Department[];
  _count?: {
    assignedComplaints?: number;
  };
};

interface StaffCardProps {
  staff: StaffWithRelations;
  onEdit: (staff: StaffWithRelations) => void;
  onDelete: (id: string) => void;
}

export default function StaffCard({ staff, onEdit, onDelete }: StaffCardProps) {
  const roleColor = {
    ADMIN: "border-red-500/20 bg-red-500/10 text-red-600",
    STAFF: "border-blue-500/20 bg-blue-500/10 text-blue-600",
    USER: "border-gray-500/20 bg-gray-500/10 text-gray-600",
  }[staff.role];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
              <User className="text-primary h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {staff.name || "Unnamed"}
              </CardTitle>
              <p className="text-muted-foreground text-sm">{staff.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className={roleColor}>
            <Shield className="mr-1 h-3 w-3" />
            {staff.role}
          </Badge>
          <Badge
            variant="outline"
            className={
              staff.isActive
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : "border-gray-500/20 bg-gray-500/10 text-gray-600"
            }
          >
            {staff.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Departments */}
        {staff.departments && staff.departments.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Departments
            </div>
            <div className="flex flex-wrap gap-1">
              {staff.departments.map((dept) => (
                <Badge key={dept.id} variant="secondary" className="text-xs">
                  {dept.name}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            No departments assigned
          </div>
        )}

        {/* Assignments */}
        {staff.role === "STAFF" && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>
              {staff._count?.assignedComplaints || 0} active assignments
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(staff)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(staff.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        {/* Timestamps */}
        <div className="text-muted-foreground text-xs">
          Joined {new Date(staff.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
