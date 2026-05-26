import { describe, it, expect, vi, beforeEach } from "vitest";
import { createComment, getCommentsForComplaint, updateComment, deleteComment } from "~/server/services/comment.service";
import { db } from "~/server/db";
import type { Prisma } from "@prisma/client";

const {
  mockFindUnique,
  mockCreate,
  mockUpdate,
  mockDelete,
  mockUpdateComplaint,
  mockCreateActivity,
  mockCreateManyNotif,
  mockFindMany,
  mockFindFirst,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockUpdateComplaint: vi.fn(),
  mockCreateActivity: vi.fn(),
  mockCreateManyNotif: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    complaint: {
      findUnique: mockFindUnique,
      update: mockUpdateComplaint,
    },
    comment: {
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
    },
    department: {
      findFirst: mockFindFirst,
    },
    complaintActivity: {
      create: mockCreateActivity,
    },
    notification: {
      createMany: mockCreateManyNotif,
    },
    $transaction: vi.fn(<T>(cb: (tx: Prisma.TransactionClient) => Promise<T>) =>
      cb(db as unknown as Prisma.TransactionClient),
    ),
  },
}));

const mockComplaint = {
  id: "complaint-1",
  userId: "user-1",
  assignedToId: null,
  departmentId: 1,
  title: "Test complaint",
  deletedAt: null,
  user: { id: "user-1", email: "u@test.com" },
};

const mockComment = {
  id: "comment-1",
  authorId: "user-1",
  complaintId: "complaint-1",
  content: "Test comment",
  isInternal: false,
};

describe("Comment Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createComment", () => {
    it("creates a public comment for the complaint owner", async () => {
      mockFindUnique.mockResolvedValueOnce(mockComplaint);
      mockCreate.mockResolvedValue({ ...mockComment, author: { id: "user-1", name: "User", role: "USER" } });
      mockUpdateComplaint.mockResolvedValue({});
      mockCreateActivity.mockResolvedValue({});

      const result = await createComment(
        { complaintId: "complaint-1", content: "Test comment", isInternal: false },
        "user-1",
        "USER",
        "Test User",
      );

      expect(result).toBeDefined();
      expect(mockCreate).toHaveBeenCalled();
    });

    it("throws ForbiddenError if USER tries to comment on someone else's complaint", async () => {
      mockFindUnique.mockResolvedValueOnce({ ...mockComplaint, userId: "other-user" });

      await expect(
        createComment(
          { complaintId: "complaint-1", content: "Test", isInternal: false },
          "user-1",
          "USER",
          "User",
        ),
      ).rejects.toThrow();
    });

    it("throws ForbiddenError if USER tries to post an internal comment", async () => {
      mockFindUnique.mockResolvedValueOnce(mockComplaint);

      await expect(
        createComment(
          { complaintId: "complaint-1", content: "Test", isInternal: true },
          "user-1",
          "USER",
          "User",
        ),
      ).rejects.toThrow("Citizens cannot post internal comments");
    });
  });

  describe("getCommentsForComplaint", () => {
    it("returns all comments including internal for ADMIN", async () => {
      mockFindMany.mockResolvedValue([mockComment, { ...mockComment, isInternal: true }]);
      const result = await getCommentsForComplaint("complaint-1", "ADMIN");
      expect(result).toHaveLength(2);
    });

    it("filters out internal comments for USER", async () => {
      mockFindMany.mockResolvedValue([mockComment]);
      await getCommentsForComplaint("complaint-1", "USER");
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isInternal: false }),
        }),
      );
    });
  });

  describe("updateComment", () => {
    it("allows the author to update their comment", async () => {
      mockFindUnique.mockResolvedValueOnce(mockComment);
      mockUpdate.mockResolvedValue({ ...mockComment, content: "Updated", author: {} });

      const result = await updateComment("comment-1", "Updated", "user-1", "USER");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { content: "Updated" } }),
      );
    });

    it("allows ADMIN to update any comment", async () => {
      mockFindUnique.mockResolvedValueOnce({ ...mockComment, authorId: "other-user" });
      mockUpdate.mockResolvedValue({ ...mockComment, content: "Updated", author: {} });

      await expect(updateComment("comment-1", "Updated", "admin-id", "ADMIN")).resolves.toBeDefined();
    });

    it("throws ForbiddenError if non-author tries to update", async () => {
      mockFindUnique.mockResolvedValueOnce(mockComment);

      await expect(
        updateComment("comment-1", "Updated", "other-user", "USER"),
      ).rejects.toThrow();
    });
  });

  describe("deleteComment", () => {
    it("allows the author to delete their comment", async () => {
      mockFindUnique.mockResolvedValueOnce(mockComment);
      mockDelete.mockResolvedValue(mockComment);

      await deleteComment("comment-1", "user-1", "USER");
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "comment-1" } });
    });

    it("throws ForbiddenError for non-author non-admin", async () => {
      mockFindUnique.mockResolvedValueOnce(mockComment);

      await expect(deleteComment("comment-1", "intruder", "USER")).rejects.toThrow();
    });
  });
});
