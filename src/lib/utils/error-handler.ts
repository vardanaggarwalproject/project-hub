import { toast } from "sonner";

/**
 * Centralized error handling utilities
 */

/**
 * Handle API errors consistently across the application
 * @param error - The error to handle
 * @param context - Context string for logging (e.g., "Dashboard fetch")
 */
export function handleApiError(error: unknown, context: string): void {
  console.error(`[${context}]`, error);

  if (error instanceof Error) {
    toast.error(error.message);
  } else if (typeof error === "string") {
    toast.error(error);
  } else {
    toast.error("An unexpected error occurred");
  }
}

/**
 * Handle async operations with error handling wrapper
 * @param fn - Async function to execute
 * @param context - Context string for error logging
 * @returns Result of the function or null if error occurs
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, context);
    return null;
  }
}
