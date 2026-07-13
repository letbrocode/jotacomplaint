import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Bypass QStash signature verification in unit tests
vi.mock("@upstash/qstash/nextjs", () => ({
  verifySignatureAppRouter: <T extends (req: NextRequest) => unknown>(
    fn: T,
  ) => fn,
}));

// Mock sendEmail
const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("~/server/email/send", () => ({
  sendEmail: mockSendEmail,
}));

// Mock db
const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));
vi.mock("~/server/db", () => ({
  db: {
    complaint: {
      findUnique: mockFindUnique,
    },
  },
}));

// Import handler AFTER mocks are set up
const { POST } = await import("./route");

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/jobs/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const baseComplaint = {
  id: "complaint-1",
  title: "Pothole on Main St",
  category: "ROADS",
  priority: "HIGH",
};

describe("POST /api/jobs/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends complaint-created email when user has email", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseComplaint,
      user: { email: "user@example.com", name: "Alice" },
    });

    const res = await POST(
      makeRequest({
        type: "complaint-created",
        complaintId: "complaint-1",
        userId: "user-1",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Your complaint has been received",
      }),
    );
  });

  it("skips complaint-created email when user has no email", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseComplaint,
      user: { email: null, name: "Alice" },
    });

    const res = await POST(
      makeRequest({
        type: "complaint-created",
        complaintId: "complaint-1",
        userId: "user-1",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sends status-updated email", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseComplaint,
      user: { email: "user@example.com", name: "Alice" },
    });

    const res = await POST(
      makeRequest({
        type: "status-updated",
        complaintId: "complaint-1",
        userId: "user-1",
        newStatus: "IN_PROGRESS",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Complaint status updated: IN_PROGRESS",
      }),
    );
  });

  it("sends complaint-resolved email", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseComplaint,
      user: { email: "user@example.com", name: "Alice" },
    });

    const res = await POST(
      makeRequest({
        type: "complaint-resolved",
        complaintId: "complaint-1",
        userId: "user-1",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Your complaint has been resolved",
      }),
    );
  });

  it("sends complaint-rejected email", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseComplaint,
      user: { email: "user@example.com", name: "Alice" },
    });

    const res = await POST(
      makeRequest({
        type: "complaint-rejected",
        complaintId: "complaint-1",
        userId: "user-1",
        rejectionNote: "Insufficient details provided.",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Update on your complaint" }),
    );
  });

  it("sends complaint-assigned email to staff", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseComplaint,
      assignedTo: { email: "staff@example.com", name: "Bob" },
    });

    const res = await POST(
      makeRequest({
        type: "complaint-assigned",
        complaintId: "complaint-1",
        assignedToId: "staff-1",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "staff@example.com",
        subject: "New complaint assigned to you",
      }),
    );
  });
});
