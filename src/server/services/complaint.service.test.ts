import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateComplaint } from "~/server/services/complaint.service";
import { db } from "~/server/db";
import { triggerComplaintUpdate } from "~/lib/pusher";
import type { Prisma } from "@prisma/client";

// Mock Prisma
const mockUpdate = vi.fn();
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();

vi.mock("~/server/db", () => ({
  db: {
    complaint: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    department: {
      findFirst: mockFindFirst,
    },
    $transaction: vi.fn(<T>(cb: (tx: Prisma.TransactionClient) => Promise<T>) =>
      cb(db as unknown as Prisma.TransactionClient),
    ),
    notification: {
      createMany: vi.fn(),
    },
    complaintActivity: {
      createMany: vi.fn(),
    },
  },
}));

// Mock Email Queue
const mockAdd = vi.fn();
vi.mock("~/server/jobs/queues", () => ({
  emailQueue: {
    add: mockAdd,
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

    mockFindUnique.mockResolvedValue(mockExisting);
    mockUpdate.mockResolvedValue(mockUpdated);

    const result = await updateComplaint(
      mockComplaintId,
      { status: "IN_PROGRESS" },
      mockActorId,
      "ADMIN",
    );

    expect(result.status).toBe("IN_PROGRESS");
    expect(mockUpdate).toHaveBeenCalled();
    
    // Verify side effects (emails)
    expect(mockAdd).toHaveBeenCalledWith("status-updated", expect.any(Object));
    
    // Verify side effects (Pusher)
    expect(vi.mocked(triggerComplaintUpdate)).toHaveBeenCalledWith(mockComplaintId, expect.any(Object));
  });

  it("should throw ForbiddenError if staff updates unassigned complaint outside their department", async () => {
    mockFindUnique.mockResolvedValue({
      id: mockComplaintId,
      assignedToId: "other-staff",
      departmentId: 1,
    });
    
    mockFindFirst.mockResolvedValue(null);

    await expect(
      updateComplaint(mockComplaintId, { status: "IN_PROGRESS" }, "staff-1", "STAFF")
    ).rejects.toThrow();
  });
});
