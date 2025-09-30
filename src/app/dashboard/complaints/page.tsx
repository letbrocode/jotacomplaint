// ~/dashboard/complaints/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { DataTable, type Complaint } from "~/components/ui/data-table"; // new simplified table

function DataTableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="ml-auto h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <div className="w-full space-y-2 p-4">
          <Skeleton className="h-8 w-full" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const res = await fetch("/api/complaints"); // updated endpoint
        if (!res.ok) throw new Error("Failed to fetch complaints");

        const data: Complaint[] = await res.json();
        setComplaints(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaints();
  }, []);

  return (
    <div className="mx-auto w-full py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My Complaints</h1>
        <p className="text-muted-foreground">
          View, manage, and track your submitted complaints.
        </p>
      </div>

      {loading ? <DataTableSkeleton /> : <DataTable complaints={complaints} />}
    </div>
  );
}
