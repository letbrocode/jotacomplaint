"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AddCommentForm({
  complaintId,
}: {
  complaintId: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/complaints/${complaintId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isInternal }),
      });

      if (!res.ok) {
        throw new Error("Failed to add comment");
      }

      toast.success("Comment added successfully");
      setContent("");
      setIsInternal(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to add comment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Add a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
        className="min-h-[100px]"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="internal"
            checked={isInternal}
            onCheckedChange={(checked) => setIsInternal(checked as boolean)}
            disabled={isSubmitting}
          />
          <Label htmlFor="internal" className="cursor-pointer text-sm">
            Internal note (staff only)
          </Label>
        </div>
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Comment"
          )}
        </Button>
      </div>
    </form>
  );
}
