import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createComplaintUploadUrl,
  generateComplaintPhotoKey,
  validateComplaintUpload,
} from "~/server/storage/s3.service";
import {
  MAX_UPLOAD_FILE_SIZE,
  presignUploadSchema,
} from "~/schemas/upload.schema";

const { mockGetSignedUrl } = vi.hoisted(() => ({
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: {
    AWS_REGION: "ap-south-1",
    AWS_ACCESS_KEY_ID: "test-access-key",
    AWS_SECRET_ACCESS_KEY: "test-secret",
    S3_UPLOAD_BUCKET: "jotacomplaint-test",
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

describe("S3 storage service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSignedUrl.mockResolvedValue("https://signed.example/upload");
  });

  it("generates safe complaint photo keys without original filenames", () => {
    const key = generateComplaintPhotoKey("user:123", "image/webp");

    expect(key).toMatch(/^complaints\/user_123\/[0-9a-f-]{36}\.webp$/);
  });

  it("rejects unsupported image MIME types", () => {
    expect(() =>
      presignUploadSchema.parse({
        contentType: "image/gif",
        fileSize: 1024,
      }),
    ).toThrow();
  });

  it("rejects files over 10MB", () => {
    expect(() =>
      validateComplaintUpload({
        contentType: "image/png",
        fileSize: MAX_UPLOAD_FILE_SIZE + 1,
      }),
    ).toThrow("File too large");
  });

  it("creates a presigned S3 PUT upload response", async () => {
    const upload = await createComplaintUploadUrl({
      userId: "user-1",
      contentType: "image/jpeg",
      fileSize: 2048,
    });

    expect(upload.uploadUrl).toBe("https://signed.example/upload");
    expect(upload.objectKey).toMatch(
      /^complaints\/user-1\/[0-9a-f-]{36}\.jpg$/,
    );
    expect(upload.headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
  });
});
