import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "~/lib/logger";

// ============================================
// Typed error classes — use these everywhere
// instead of throwing plain Error objects.
// ============================================

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be logged in to perform this action") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 422);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
    this.name = "RateLimitError";
  }
}

/**
 * Narrows an unknown catch value to AppError.
 * Returns a generic AppError if it's an unknown type.
 */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new AppError(err.message, "INTERNAL_ERROR", 500);
  return new AppError("An unexpected error occurred", "INTERNAL_ERROR", 500);
}

/**
 * Standard error handler for API routes.
 * Logs the error via Pino and returns a formatted NextResponse.
 */
export function handleApiError(err: unknown) {
  if (err instanceof z.ZodError) {
    logger.warn({ errors: err.errors }, "API Validation Error");
    return NextResponse.json(
      { error: "Validation failed", details: err.errors },
      { status: 400 },
    );
  }

  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({ err }, `API Error: ${err.message}`);
    } else {
      logger.warn({ code: err.code, status: err.status }, `API Warning: ${err.message}`);
    }
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status },
    );
  }

  // Fallback for unknown errors
  logger.error({ err }, "Unhandled API Error");
  return NextResponse.json(
    { error: "An unexpected error occurred", code: "INTERNAL_SERVER_ERROR" },
    { status: 500 },
  );
}
