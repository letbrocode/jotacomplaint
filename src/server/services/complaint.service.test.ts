import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateComplaint } from "~/server/services/complaint.service";
import { db } from "~/server/db";
import { emailQueue } from "~/server/jobs/queues";
import { triggerComplaintUpdate } from "~/lib/pusher";
import type { Prisma } from "@prisma/client";

// Mock Prisma
vi.mock("~/server/db", () => ({
  db: {
    complaint: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    department: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(<T>(cb: (tx: Prisma.TransactionClient) => Promise<T>) => cb(db as any)),
    notification: {
      createMany: vi.fn(),
    },
    complaintActivity: {
      createMany: vi.fn(),
    },
  },
}));

describe("Complaint Service - updateComplaint", () => {
  const mockActorId = "actor-123";
  const mockComplaintId = "complaint-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully update complaint status and trigger side effects", async () => {
    const mockExisting = {
      id: mockComplaintId,
      status: "PENDING",
      userId: "user-1",
      assignedToId: null,
      departmentId: 1,
      title: "Pothole",
    };

    const mockUpdated = {
      ...mockExisting,
      status: "IN_PROGRESS",
      updatedAt: new Date(),
    };

    vi.mocked(db.complaint).findUnique.mockResolvedValue(mockExisting as never);
    vi.mocked(db.complaint).update.mockResolvedValue(mockUpdated as never);

    const result = await updateComplaint(
      mockComplaintId,
      { status: "IN_PROGRESS" },
      mockActorId,
      "ADMIN",
    );

    expect(result.status).toBe("IN_PROGRESS");
    expect(vi.mocked(db.complaint).update).toHaveBeenCalled();
    
    // Verify side effects (emails)
    expect(vi.mocked(emailQueue).add).toHaveBeenCalledWith("status-updated", expect.any(Object));
    
    // Verify side effects (Pusher)
    expect(vi.mocked(triggerComplaintUpdate)).toHaveBeenCalledWith(mockComplaintId, expect.any(Object));
  });

  it("should throw ForbiddenError if staff updates unassigned complaint outside their department", async () => {
    vi.mocked(db.complaint).findUnique.mockResolvedValue({
      id: mockComplaintId,
      assignedToId: "other-staff",
      departmentId: 1,
    } as never);
    
    vi.mocked(db.department).findFirst.mockResolvedValue(null as never);

    await expect(
      updateComplaint(mockComplaintId, { status: "IN_PROGRESS" }, "staff-1", "STAFF")
    ).rejects.toThrow();
  });
});
