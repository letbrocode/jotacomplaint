"use client";

import React, { useRef, useState } from "react";
import { RiImageAddLine } from "react-icons/ri";
import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";

type UploadAuth = {
  signature: string;
  expire: number;
  token: string;
  publicKey: string;
};

type UploadResponse = {
  url: string;
};

const MAX_FILE_SIZE = 10_000_000; // 10MB

const Dropzone = ({
  onUploadComplete,
}: {
  onUploadComplete: (url?: string) => void;
}) => {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef(new AbortController());

  const authenticator = async (): Promise<UploadAuth> => {
    const response = await fetch("/api/upload-auth");
    if (!response.ok) {
      throw new Error(`Auth failed: ${await response.text()}`);
    }
    return (await response.json()) as UploadAuth;
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 10MB.";
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      e.target.value = ""; // reset input so user can re-upload same file
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const { signature, expire, token, publicKey } = await authenticator();

      const uploadResponse = (await upload({
        file,
        fileName: file.name,
        folder: "/complaints",
        token,
        expire,
        signature,
        publicKey,
        onProgress: (evt: ProgressEvent) =>
          setProgress((evt.loaded / evt.total) * 100),
        abortSignal: abortControllerRef.current.signal,
      })) as UploadResponse;

      onUploadComplete(uploadResponse.url);
    } catch (error) {
      if (error instanceof ImageKitAbortError)
        console.error("Upload aborted:", error.reason);
      else if (error instanceof ImageKitInvalidRequestError)
        console.error("Invalid request:", error.message);
      else if (error instanceof ImageKitUploadNetworkError)
        console.error("Network error:", error.message);
      else if (error instanceof ImageKitServerError)
        console.error("Server error:", error.message);
      else console.error("Upload error:", error);
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
        accept="image/*"
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
          <progress value={progress} max={100} className="mt-4 w-3/4" />
        )}
      </label>
    </div>
  );
};

export default Dropzone;
