import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "~/server/services/department.service";
import { db } from "~/server/db";

const {
  mockFindMany,
  mockFindUnique,
  mockCreate,
  mockUpdate,
  mockDelete,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    department: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

const mockDept = {
  id: 1,
  name: "Water",
  description: null,
  email: null,
  phone: null,
  isActive: true,
  _count: { complaints: 0, staff: 0 },
};

describe("Department Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllDepartments", () => {
    it("returns active departments by default", async () => {
      mockFindMany.mockResolvedValue([mockDept]);
      const result = await getAllDepartments();
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
      expect(result).toHaveLength(1);
    });

    it("includes inactive departments when flag is set", async () => {
      mockFindMany.mockResolvedValue([mockDept, { ...mockDept, isActive: false }]);
      const result = await getAllDepartments(true);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("getDepartmentById", () => {
    it("returns a department by id", async () => {
      mockFindUnique.mockResolvedValue(mockDept);
      const result = await getDepartmentById(1);
      expect(result.id).toBe(1);
    });

    it("throws NotFoundError when department does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(getDepartmentById(999)).rejects.toThrow("Department not found");
    });
  });

  describe("createDepartment", () => {
    it("creates a department with valid data", async () => {
      mockCreate.mockResolvedValue(mockDept);
      const result = await createDepartment({ name: "Water" });
      expect(mockCreate).toHaveBeenCalledWith({ data: { name: "Water" } });
      expect(result.name).toBe("Water");
    });
  });

  describe("updateDepartment", () => {
    it("updates an existing department", async () => {
      mockFindUnique.mockResolvedValue(mockDept);
      mockUpdate.mockResolvedValue({ ...mockDept, name: "Roads" });
      const result = await updateDepartment(1, { name: "Roads" });
      expect(result.name).toBe("Roads");
    });

    it("throws NotFoundError for unknown department", async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(updateDepartment(999, { name: "X" })).rejects.toThrow("Department not found");
    });
  });

  describe("deleteDepartment", () => {
    it("deletes a department with no complaints or staff", async () => {
      mockFindUnique.mockResolvedValue(mockDept);
      mockDelete.mockResolvedValue(mockDept);
      await deleteDepartment(1);
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("throws an error if department has active complaints", async () => {
      mockFindUnique.mockResolvedValue({ ...mockDept, _count: { complaints: 3, staff: 0 } });
      await expect(deleteDepartment(1)).rejects.toThrow("active complaint");
    });

    it("throws an error if department has staff members", async () => {
      mockFindUnique.mockResolvedValue({ ...mockDept, _count: { complaints: 0, staff: 2 } });
      await expect(deleteDepartment(1)).rejects.toThrow("staff member");
    });

    it("throws NotFoundError for unknown department", async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(deleteDepartment(999)).rejects.toThrow("Department not found");
    });
  });
});
