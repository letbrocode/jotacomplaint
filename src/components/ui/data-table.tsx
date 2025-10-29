"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { ComplaintWithRelations } from "~/types/complaint";

export type Complaint = {
  id: string;
  title: string;
  details: string;
  category: "ROADS" | "WATER" | "ELECTRICITY" | "SANITATION" | "OTHER";
  location?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
};

export function DataTable({
  complaints,
}: {
  complaints: ComplaintWithRelations[];
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-6 text-center">
                No complaints found.
              </TableCell>
            </TableRow>
          ) : (
            complaints.map((complaint) => (
              <TableRow key={complaint.id}>
                <TableCell>{complaint.title}</TableCell>
                <TableCell>{complaint.category}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${
                      complaint.priority === "HIGH"
                        ? "border-red-600 text-red-600"
                        : complaint.priority === "MEDIUM"
                          ? "border-yellow-600 text-yellow-600"
                          : "border-green-600 text-green-600"
                    }`}
                  >
                    {complaint.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${
                      complaint.status === "RESOLVED"
                        ? "border-green-600 text-green-600"
                        : complaint.status === "IN_PROGRESS"
                          ? "border-yellow-600 text-yellow-600"
                          : "border-gray-600 text-gray-600"
                    }`}
                  >
                    {complaint.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {complaint.assignedTo?.name || "Unassigned"}
                </TableCell>
                <TableCell>
                  {new Date(complaint.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {new Date(complaint.updatedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    <a href={`/admin/complaints/${complaint.id}`}>View</a>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
