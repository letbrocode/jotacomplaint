"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function UpdateStatusForm({
  complaintId,
  currentStatus,
}: {
  complaintId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === currentStatus) {
      toast.info("Status unchanged");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Status updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
        <SelectTrigger className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[60]">
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="RESOLVED">Resolved</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isSubmitting || status === currentStatus}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Status"
        )}
      </Button>
    </form>
  );
}
