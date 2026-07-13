import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

// Bypass QStash signature verification in unit tests
vi.mock("@upstash/qstash/nextjs", () => ({
  verifySignatureAppRouter: <T extends (req: NextRequest) => unknown>(
    fn: T,
  ) => fn,
}));

// Mock db
const {
  mockFindMany,
  mockUpdate,
  mockFindFirst,
  mockCreate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    complaint: {
      findMany: mockFindMany,
      update: mockUpdate,
    },
    user: {
      findFirst: mockFindFirst,
    },
    complaintActivity: {
      create: mockCreate,
    },
    notification: {
      create: mockCreate,
    },
    $transaction: mockTransaction,
  },
}));

// Import handler AFTER mocks
const { POST } = await import("./route");

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/jobs/escalation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/jobs/escalation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns escalated: 0 when no overdue complaints exist", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await POST(makeRequest({ type: "check-sla" }));
    const json = (await res.json()) as { ok: boolean; escalated: number };

    expect(res.status).toBe(200);
    expect(json.escalated).toBe(0);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("escalates overdue complaints and returns count", async () => {
    const overdue = [
      {
        id: "c-1",
        title: "Broken pipe",
        status: "PENDING",
        userId: "user-1",
        user: { email: "u@example.com" },
      },
      {
        id: "c-2",
        title: "Street light out",
        status: "IN_PROGRESS",
        userId: "user-2",
        user: { email: "u2@example.com" },
      },
    ];

    mockFindMany.mockResolvedValue(overdue);
    mockTransaction.mockImplementation(
      async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
        const tx = {
          complaint: { update: mockUpdate },
          user: { findFirst: mockFindFirst },
          complaintActivity: { create: mockCreate },
          notification: { create: mockCreate },
        } as unknown as Prisma.TransactionClient;
        return cb(tx);
      },
    );
    mockFindFirst.mockResolvedValue({ id: "admin-1" });
    mockUpdate.mockResolvedValue({});
    mockCreate.mockResolvedValue({});

    const res = await POST(makeRequest({ type: "check-sla" }));
    const json = (await res.json()) as { ok: boolean; escalated: number };

    expect(res.status).toBe(200);
    expect(json.escalated).toBe(2);
    expect(mockTransaction).toHaveBeenCalledTimes(2);
  });
});
