"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import type { Complaint, User, Department } from "@prisma/client";
import ComplaintCard from "~/components/complaint-card";

type ComplaintWithRelations = Complaint & {
  user: User;
  department: Department | null;
  assignedTo?: User | null;
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [complaintsRes, staffRes] = await Promise.all([
          fetch("/api/complaints"),
          fetch("/api/staff"),
        ]);

        if (!complaintsRes.ok) throw new Error("Failed to fetch complaints");
        if (!staffRes.ok) throw new Error("Failed to fetch staff");

        const complaintsData = await complaintsRes.json();
        const staffData = await staffRes.json();

        setComplaints(complaintsData);
        setStaffList(staffData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading)
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold tracking-tight">All Complaints</h1>
      <p className="text-muted-foreground">
        View and manage all complaints registered by users.
      </p>

      <div className="space-y-4">
        {complaints.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            staffList={staffList} // ✅ pass staff list here
          />
        ))}
      </div>
    </div>
  );
}
