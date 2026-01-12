/**
 * Application-wide constants
 */

// Report constraints
export const MEMO_MAX_LENGTH = 140;
export const MISSING_UPDATES_DAYS_TO_CHECK = 2;

// Cache configuration for Next.js fetch
export const CACHE_REVALIDATE = {
  NONE: 0,
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
