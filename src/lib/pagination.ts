// ============================================
// Cursor-based pagination utilities
// ============================================

export type PaginatedResponse<T> = {
  data: T[];
  nextCursor: string | null;
  total: number;
};

export type PaginationParams = {
  cursor?: string;
  take?: number;
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Normalise and clamp pagination params from URL search params.
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const cursor = searchParams.get("cursor") ?? undefined;
  const rawTake = Number(searchParams.get("take") ?? DEFAULT_PAGE_SIZE);
  const take = Math.min(Math.max(1, rawTake), MAX_PAGE_SIZE);
  return { cursor, take };
}

/**
 * Build Prisma cursor args from pagination params.
 * Always fetches take+1 to determine if there is a next page.
 */
export function buildCursorQuery(params: PaginationParams): {
  take: number;
  skip: number;
  cursor?: { id: string };
} {
  const take = params.take ?? DEFAULT_PAGE_SIZE;
  return {
    take: take + 1, // fetch one extra to check for next page
    skip: params.cursor ? 1 : 0,
    ...(params.cursor ? { cursor: { id: params.cursor } } : {}),
  };
}

/**
 * Slice the result set and compute the next cursor.
 */
export function buildPaginatedResponse<T extends { id: string }>(
  items: T[],
  take: number,
  total: number,
): PaginatedResponse<T> {
  const hasNextPage = items.length > take;
  const data = hasNextPage ? items.slice(0, take) : items;
  const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null;
  return { data, nextCursor, total };
}
