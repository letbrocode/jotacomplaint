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

const Dropzone = ({
  onUploadComplete,
}: {
  onUploadComplete: (url?: string) => void;
}) => {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortController = new AbortController();

  // 🔐 Get upload credentials from backend route `/api/upload-auth`
  const authenticator = async () => {
    const response = await fetch("/api/upload-auth");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth failed: ${errorText}`);
    }
    const { signature, expire, token, publicKey } = await response.json();
    return { signature, expire, token, publicKey };
  };

  // 🚀 Handle upload using ImageKit SDK
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setUploading(true);
    setProgress(0);

    try {
      const { signature, expire, token, publicKey } = await authenticator();

      const uploadResponse = await upload({
        file,
        fileName: file.name,
        folder: "/complaints", // 🗂 store all uploads in complaints folder
        token,
        expire,
        signature,
        publicKey,
        onProgress: (evt) => setProgress((evt.loaded / evt.total) * 100),
        abortSignal: abortController.signal,
      });

      console.log("✅ Uploaded:", uploadResponse);
      alert("File uploaded successfully!");
      onUploadComplete(uploadResponse.url);
    } catch (error) {
      if (error instanceof ImageKitAbortError) {
        console.error("Upload aborted:", error.reason);
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid request:", error.message);
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Network error:", error.message);
      } else if (error instanceof ImageKitServerError) {
        console.error("Server error:", error.message);
      } else {
        console.error("Upload error:", error);
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
          <progress
            value={progress}
            max={100}
            className="mt-4 w-3/4"
          ></progress>
        )}
      </label>
    </div>
  );
};

export default Dropzone;
