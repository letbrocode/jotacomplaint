import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

const { mockRequireAuth, mockCreateComplaintUploadUrl } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockCreateComplaintUploadUrl: vi.fn(),
}));

vi.mock("~/lib/auth-guards", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("~/server/storage/s3.service", () => ({
  createComplaintUploadUrl: mockCreateComplaintUploadUrl,
}));

describe("POST /api/uploads/presign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateComplaintUploadUrl.mockResolvedValue({
      objectKey: "complaints/user-1/photo.webp",
      uploadUrl: "https://signed.example/upload",
      expiresIn: 300,
      headers: { "Content-Type": "image/webp" },
    });
  });

  it("returns a presigned upload URL for authenticated users", async () => {
    const response = await POST(
      new Request("http://localhost/api/uploads/presign", {
        method: "POST",
        body: JSON.stringify({
          contentType: "image/webp",
          fileSize: 1024,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      objectKey: "complaints/user-1/photo.webp",
      uploadUrl: "https://signed.example/upload",
      expiresIn: 300,
      headers: { "Content-Type": "image/webp" },
    });
    expect(mockCreateComplaintUploadUrl).toHaveBeenCalledWith({
      userId: "user-1",
      contentType: "image/webp",
      fileSize: 1024,
    });
  });

  it("rejects unsupported upload MIME types before signing", async () => {
    const response = await POST(
      new Request("http://localhost/api/uploads/presign", {
        method: "POST",
        body: JSON.stringify({
          contentType: "image/gif",
          fileSize: 1024,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockCreateComplaintUploadUrl).not.toHaveBeenCalled();
  });
});
