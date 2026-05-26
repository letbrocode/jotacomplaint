import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserById,
  getAllUsers,
  getStaffMembers,
  updateUserProfile,
  deactivateUser,
  setUserActiveStatus,
  deleteUser,
} from "~/server/services/user.service";

const {
  mockFindUnique,
  mockFindMany,
  mockUpdate,
  mockDelete,
  mockCount,
  mockTransaction,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockCount: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
      delete: mockDelete,
      count: mockCount,
    },
    $transaction: mockTransaction,
  },
}));

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@test.com",
  role: "USER" as const,
  isActive: true,
  phone: null,
  avatar: null,
  bio: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  emailOnCreated: true,
  emailOnAssigned: true,
  emailOnStatusUpdate: true,
  emailOnResolved: true,
};

describe("User Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserById", () => {
    it("returns a user by id", async () => {
      mockFindUnique.mockResolvedValue(mockUser);
      const result = await getUserById("user-1");
      expect(result.id).toBe("user-1");
    });

    it("throws NotFoundError if user does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(getUserById("ghost")).rejects.toThrow("User not found");
    });
  });

  describe("getAllUsers", () => {
    it("returns paginated users with total count", async () => {
      mockFindMany.mockResolvedValue([mockUser]);
      mockCount.mockResolvedValue(1);
      const result = await getAllUsers();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("filters by role when provided", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);
      await getAllUsers({ role: "STAFF" });
      expect(mockFindMany).toHaveBeenCalled();
      const [callArg] = mockFindMany.mock.calls[0] as [{ where: { role?: string } }];
      expect(callArg.where.role).toBe("STAFF");
    });
  });

  describe("getStaffMembers", () => {
    it("returns all active staff and admin users", async () => {
      mockFindMany.mockResolvedValue([{ ...mockUser, role: "STAFF" }]);
      const result = await getStaffMembers();
      expect(mockFindMany).toHaveBeenCalled();
      const [callArg] = mockFindMany.mock.calls[0] as [
        { where: { role?: { in: string[] }; isActive?: boolean } },
      ];
      expect(callArg.where.isActive).toBe(true);
      expect(callArg.where.role?.in).toContain("STAFF");
      expect(result).toHaveLength(1);
    });
  });

  describe("updateUserProfile", () => {
    it("updates user profile fields", async () => {
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue({ ...mockUser, name: "Updated Name" });
      const result = await updateUserProfile("user-1", { name: "Updated Name" });
      expect(result.name).toBe("Updated Name");
    });

    it("throws NotFoundError for non-existent user", async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(updateUserProfile("ghost", { name: "X" })).rejects.toThrow("User not found");
    });
  });

  describe("deactivateUser", () => {
    it("sets isActive to false", async () => {
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue({ ...mockUser, isActive: false });
      await deactivateUser("user-1");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });
  });

  describe("setUserActiveStatus", () => {
    it("activates a user", async () => {
      mockFindUnique.mockResolvedValue({ ...mockUser, isActive: false });
      mockUpdate.mockResolvedValue({ ...mockUser, isActive: true });
      await setUserActiveStatus("user-1", true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: true } }),
      );
    });
  });

  describe("deleteUser", () => {
    it("deletes a user with no complaints", async () => {
      mockFindUnique.mockResolvedValue({ ...mockUser, _count: { complaints: 0 } });
      mockDelete.mockResolvedValue(mockUser);
      await deleteUser("user-1");
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    });

    it("throws an error if user has complaints", async () => {
      mockFindUnique.mockResolvedValue({ ...mockUser, _count: { complaints: 2 } });
      await expect(deleteUser("user-1")).rejects.toThrow("Cannot delete user");
    });

    it("throws NotFoundError for non-existent user", async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(deleteUser("ghost")).rejects.toThrow("User not found");
    });
  });
});
