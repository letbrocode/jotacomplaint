import { randomUUID } from "node:crypto";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";
import { AppError, ValidationError } from "~/lib/errors";
import {
  allowedImageMimeTypes,
  MAX_UPLOAD_FILE_SIZE,
  type PresignUploadInput,
} from "~/schemas/upload.schema";

const UPLOAD_URL_EXPIRES_IN_SECONDS = 300;
const READ_URL_EXPIRES_IN_SECONDS = 300;

const extensionByMimeType: Record<
  (typeof allowedImageMimeTypes)[number],
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let s3Client: S3Client | null = null;

function getS3Config() {
  const {
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    S3_UPLOAD_BUCKET,
  } = env;

  if (
    !AWS_REGION ||
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY ||
    !S3_UPLOAD_BUCKET
  ) {
    throw new AppError(
      "S3 storage is not configured",
      "S3_NOT_CONFIGURED",
      500,
    );
  }

  return {
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    bucket: S3_UPLOAD_BUCKET,
  };
}

function getS3Client() {
  const config = getS3Config();

  s3Client ??= new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return { client: s3Client, bucket: config.bucket };
}

function getFileExtension(contentType: PresignUploadInput["contentType"]) {
  const extension = extensionByMimeType[contentType];
  if (!extension) {
    throw new ValidationError("Unsupported file type");
  }

  return extension;
}

function sanitizeKeySegment(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "_");
}

export function validateComplaintUpload(input: PresignUploadInput) {
  if (!allowedImageMimeTypes.includes(input.contentType)) {
    throw new ValidationError("Unsupported file type");
  }

  if (input.fileSize <= 0 || input.fileSize > MAX_UPLOAD_FILE_SIZE) {
    throw new ValidationError("File too large. Maximum size is 10MB.");
  }
}

export function generateComplaintPhotoKey(
  userId: string,
  contentType: PresignUploadInput["contentType"],
) {
  const extension = getFileExtension(contentType);
  return `complaints/${sanitizeKeySegment(userId)}/${randomUUID()}.${extension}`;
}

export async function createComplaintUploadUrl({
  userId,
  contentType,
  fileSize,
}: PresignUploadInput & { userId: string }) {
  validateComplaintUpload({ contentType, fileSize });

  const { client, bucket } = getS3Client();
  const objectKey = generateComplaintPhotoKey(userId, contentType);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
  });

  return {
    objectKey,
    uploadUrl,
    expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
    headers: {
      "Content-Type": contentType,
    },
  };
}

export async function createComplaintReadUrl(
  photoKey: string | null | undefined,
) {
  if (!photoKey) return null;

  const { client, bucket } = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: photoKey,
  });

  return getSignedUrl(client, command, {
    expiresIn: READ_URL_EXPIRES_IN_SECONDS,
  });
}

export async function createComplaintReadUrlMap<
  T extends { id: string; photoKey: string | null },
>(complaints: T[]) {
  const results = await Promise.allSettled(
    complaints.map((complaint) => createComplaintReadUrl(complaint.photoKey)),
  );

  return Object.fromEntries(
    complaints.map((complaint, index) => {
      const result = results[index];
      return [
        complaint.id,
        result?.status === "fulfilled" ? result.value : null,
      ];
    }),
  );
}
