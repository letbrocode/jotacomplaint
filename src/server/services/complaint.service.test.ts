import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateComplaint } from "~/server/services/complaint.service";
import { db } from "~/server/db";
import { emailQueue } from "~/server/jobs/queues";
import { triggerComplaintUpdate } from "~/lib/pusher";

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
    $transaction: vi.fn((cb) => cb(db)),
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

    (db.complaint.findUnique as any).mockResolvedValue(mockExisting);
    (db.complaint.update as any).mockResolvedValue(mockUpdated);

    const result = await updateComplaint(
      mockComplaintId,
      { status: "IN_PROGRESS" },
      mockActorId,
      "ADMIN",
    );

    expect(result.status).toBe("IN_PROGRESS");
    expect(db.complaint.update).toHaveBeenCalled();
    
    // Verify side effects (emails)
    expect(emailQueue.add).toHaveBeenCalledWith("status-updated", expect.any(Object));
    
    // Verify side effects (Pusher)
    expect(triggerComplaintUpdate).toHaveBeenCalledWith(mockComplaintId, expect.any(Object));
  });

  it("should throw ForbiddenError if staff updates unassigned complaint outside their department", async () => {
    (db.complaint.findUnique as any).mockResolvedValue({
      id: mockComplaintId,
      assignedToId: "other-staff",
      departmentId: 1,
    });
    
    (db.department.findFirst as any).mockResolvedValue(null);

    await expect(
      updateComplaint(mockComplaintId, { status: "IN_PROGRESS" }, "staff-1", "STAFF")
    ).rejects.toThrow();
  });
});
