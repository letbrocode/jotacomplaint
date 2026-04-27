import { type NextResponse } from "next/server";
import { NextResponse as NR } from "next/server";
import { ZodError } from "zod";
import { AppError, toAppError } from "./errors";

// ============================================
// Standard API response shapes
// ============================================

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: {
    total?: number;
    nextCursor?: string | null;
    page?: number;
  };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================
// Response builders
// ============================================

export function ok<T>(
  data: T,
  meta?: ApiSuccess<T>["meta"],
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NR.json({ success: true, data, ...(meta ? { meta } : {}) }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NR.json({ success: true, data }, { status: 201 });
}

export function apiError(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiError> {
  return NR.json({ success: false, error: { code, message } }, { status });
}

// ============================================
// Central error handler — use in every catch block
// ============================================

export function handleApiError(err: unknown): NextResponse<ApiError> {
  console.error("[API Error]", err);

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(", ");
    return apiError("VALIDATION_ERROR", message, 422);
  }

  const appErr = toAppError(err);
  return apiError(appErr.code, appErr.message, appErr.status);
}

// ============================================
// Server Action result types
// ============================================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export function actionOk<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionErr(err: unknown): ActionResult<never> {
  if (err instanceof AppError) return { success: false, error: err.message };
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(", ");
    return { success: false, error: message };
  }
  if (err instanceof Error) return { success: false, error: err.message };
  return { success: false, error: "An unexpected error occurred" };
}
