import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createComplaintUploadUrl,
  createComplaintReadUrl,
  createComplaintReadUrlMap,
  generateComplaintPhotoKey,
  validateComplaintUpload,
  _readUrlCache,
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
    // Clear the in-process TTL cache so stale entries from a previous test
    // don't bleed into the next one and bypass mockRejectedValueOnce.
    _readUrlCache.clear();
    mockGetSignedUrl.mockResolvedValue("https://signed.example/url");
  });

  // ── Key Generation ────────────────────────────────────────

  it("generates safe complaint photo keys without original filenames", () => {
    const key = generateComplaintPhotoKey("user:123", "image/webp");

    expect(key).toMatch(/^complaints\/user_123\/[0-9a-f-]{36}\.webp$/);
  });

  it("maps image/jpeg to .jpg extension in key", () => {
    const key = generateComplaintPhotoKey("u1", "image/jpeg");
    expect(key).toMatch(/\.jpg$/);
  });

  it("maps image/png to .png extension in key", () => {
    const key = generateComplaintPhotoKey("u1", "image/png");
    expect(key).toMatch(/\.png$/);
  });

  // ── Validation ────────────────────────────────────────────

  it("rejects unsupported image MIME types via Zod schema", () => {
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

  it("rejects zero-size files", () => {
    expect(() =>
      validateComplaintUpload({
        contentType: "image/png",
        fileSize: 0,
      }),
    ).toThrow("File too large");
  });

  it("rejects negative-size files", () => {
    expect(() =>
      validateComplaintUpload({
        contentType: "image/png",
        fileSize: -1,
      }),
    ).toThrow("File too large");
  });

  // ── Upload URL ────────────────────────────────────────────

  it("creates a presigned S3 PUT upload response", async () => {
    const upload = await createComplaintUploadUrl({
      userId: "user-1",
      contentType: "image/jpeg",
      fileSize: 2048,
    });

    expect(upload.uploadUrl).toBe("https://signed.example/url");
    expect(upload.objectKey).toMatch(
      /^complaints\/user-1\/[0-9a-f-]{36}\.jpg$/,
    );
    expect(upload.headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(upload.expiresIn).toBe(300);
    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
  });

  it("propagates S3 SDK errors from upload presigning", async () => {
    mockGetSignedUrl.mockRejectedValue(new Error("S3 unreachable"));

    await expect(
      createComplaintUploadUrl({
        userId: "user-1",
        contentType: "image/webp",
        fileSize: 1024,
      }),
    ).rejects.toThrow("S3 unreachable");
  });

  // ── Read URL ──────────────────────────────────────────────

  it("creates a presigned GET URL for a valid photo key", async () => {
    const url = await createComplaintReadUrl("complaints/u1/abc.webp");

    expect(url).toBe("https://signed.example/url");
    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
  });

  it("returns null for a null photo key", async () => {
    const url = await createComplaintReadUrl(null);

    expect(url).toBeNull();
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("returns null for an undefined photo key", async () => {
    const url = await createComplaintReadUrl(undefined);

    expect(url).toBeNull();
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  // ── Read URL Map ──────────────────────────────────────────

  it("creates a read URL map for multiple complaints", async () => {
    const complaints = [
      { id: "c1", photoKey: "complaints/u1/a.webp" },
      { id: "c2", photoKey: null },
      { id: "c3", photoKey: "complaints/u1/b.jpg" },
    ];

    const map = await createComplaintReadUrlMap(complaints);

    expect(map).toEqual({
      c1: "https://signed.example/url",
      c2: null,
      c3: "https://signed.example/url",
    });
  });

  it("handles S3 errors gracefully in the read URL map (Promise.allSettled)", async () => {
    mockGetSignedUrl
      .mockResolvedValueOnce("https://signed.example/url")
      .mockRejectedValueOnce(new Error("S3 failure"));

    const complaints = [
      { id: "c1", photoKey: "complaints/u1/a.webp" },
      { id: "c2", photoKey: "complaints/u1/b.webp" },
    ];

    const map = await createComplaintReadUrlMap(complaints);

    expect(map).toEqual({
      c1: "https://signed.example/url",
      c2: null,
    });
  });

  it("returns empty object for empty complaint list", async () => {
    const map = await createComplaintReadUrlMap([]);

    expect(map).toEqual({});
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });
});
