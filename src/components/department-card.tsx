"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Building2,
  Mail,
  Phone,
  Users,
  AlertTriangle,
  Edit,
  Trash2,
} from "lucide-react";
import type { Department } from "@prisma/client";

type DepartmentWithStats = Department & {
  _count?: {
    complaints?: number;
    staff?: number;
  };
};

interface DepartmentCardProps {
  department: DepartmentWithStats;
  onEdit: (department: DepartmentWithStats) => void;
  onDelete: (id: number) => void;
}

export default function DepartmentCard({
  department,
  onEdit,
  onDelete,
}: DepartmentCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-primary h-5 w-5" />
            <CardTitle className="text-lg">{department.name}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={
              department.isActive
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : "border-gray-500/20 bg-gray-500/10 text-gray-600"
            }
          >
            {department.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {department.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {department.description}
          </p>
        )}

        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          {department.email && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${department.email}`}
                className="hover:text-primary hover:underline"
              >
                {department.email}
              </a>
            </div>
          )}
          {department.phone && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a
                href={`tel:${department.phone}`}
                className="hover:text-primary hover:underline"
              >
                {department.phone}
              </a>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{department._count?.staff ?? 0} staff</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span>{department._count?.complaints ?? 0} complaints</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(department)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(department.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        {/* Timestamps */}
        <div className="text-muted-foreground text-xs">
          Created {new Date(department.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
