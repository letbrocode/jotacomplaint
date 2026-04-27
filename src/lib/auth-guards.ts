import { auth } from "~/server/auth";
import type { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "./errors";

// ============================================
// Auth guards — call at the top of every
// server action and service function that
// requires authentication.
// ============================================

/**
 * Returns the current session or throws UnauthorizedError.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session;
}

/**
 * Returns the session if the user has one of the allowed roles,
 * otherwise throws the appropriate error.
 */
export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError(
      `This action requires one of the following roles: ${roles.join(", ")}`,
    );
  }
  return session;
}

/**
 * Returns true if the session user is ADMIN.
 */
export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

/**
 * Returns true if the session user is STAFF or ADMIN.
 */
export function isStaffOrAdmin(role: Role): boolean {
  return role === "ADMIN" || role === "STAFF";
}
