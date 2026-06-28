"use client";

import React, { useRef, useState } from "react";
import { RiImageAddLine } from "react-icons/ri";
import { toast } from "sonner";
import {
  allowedImageMimeTypes,
  MAX_UPLOAD_FILE_SIZE,
} from "~/schemas/upload.schema";

type PresignResponse = {
  objectKey: string;
  uploadUrl: string;
  headers: Record<string, string>;
};

const ACCEPTED_FILE_TYPES = allowedImageMimeTypes.join(",");

const Dropzone = ({
  onUploadComplete,
}: {
  onUploadComplete: (upload?: {
    objectKey: string;
    previewUrl: string;
  }) => void;
}) => {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const createUploadUrl = async (file: File): Promise<PresignResponse> => {
    const response = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: file.type,
        fileSize: file.size,
      }),
    });

    if (!response.ok) {
      throw new Error(`Upload request failed: ${await response.text()}`);
    }

    return (await response.json()) as PresignResponse;
  };

  const uploadFile = (file: File, presign: PresignResponse) =>
    new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      xhrRef.current = request;

      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress((event.loaded / event.total) * 100);
        }
      };

      request.onload = () => {
        xhrRef.current = null;
        if (request.status >= 200 && request.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${request.status}`));
        }
      };

      request.onerror = () => {
        xhrRef.current = null;
        reject(new Error("S3 upload failed"));
      };

      request.onabort = () => {
        xhrRef.current = null;
        reject(new Error("Upload cancelled"));
      };

      request.open("PUT", presign.uploadUrl);
      Object.entries(presign.headers).forEach(([key, value]) => {
        request.setRequestHeader(key, value);
      });
      request.send(file);
    });

  const cancelUpload = () => {
    xhrRef.current?.abort();
  };

  const isAllowedMimeType = (
    contentType: string,
  ): contentType is (typeof allowedImageMimeTypes)[number] =>
    allowedImageMimeTypes.some((allowedType) => allowedType === contentType);

  const validateFile = (file: File): string | null => {
    if (!isAllowedMimeType(file.type)) {
      return "Only JPEG, PNG, and WebP images are allowed.";
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      return "File too large. Maximum size is 10MB.";
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = ""; // reset input so user can re-upload same file
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const presign = await createUploadUrl(file);
      await uploadFile(file, presign);
      onUploadComplete({
        objectKey: presign.objectKey,
        previewUrl: URL.createObjectURL(file),
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Upload cancelled") {
        toast.info("Upload cancelled.");
      } else {
        console.error("Upload error:", error);
        toast.error("Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-16">
      <input
        ref={fileInputRef}
        type="file"
        id="file-input"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />

      <label
        htmlFor="file-input"
        className={`bg-card text-card-foreground relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-[#dadada] px-10 py-10 transition-colors duration-200 ${
          uploading ? "cursor-wait opacity-60" : ""
        }`}
      >
        <div className="border-border absolute inset-4 rounded-2xl border border-dashed"></div>
        <p>{uploading ? "Uploading..." : "Upload a file"}</p>
        <RiImageAddLine className="h-10 w-10" />

        {uploading && (
          <div className="mt-4 flex w-3/4 items-center gap-2">
            <progress value={progress} max={100} className="flex-1" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                cancelUpload();
              }}
              className="text-muted-foreground hover:text-destructive text-xs underline"
            >
              Cancel
            </button>
          </div>
        )}
      </label>
    </div>
  );
};

export default Dropzone;
