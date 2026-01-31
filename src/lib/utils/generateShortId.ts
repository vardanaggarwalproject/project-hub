import { customAlphabet } from 'nanoid';

/**
 * Generate a unique short ID for tasks
 * Format: PH-XXXXXX (e.g., PH-A1B2C3)
 * Uses alphanumeric characters (uppercase letters and numbers)
 */

// Custom alphabet: uppercase letters and numbers (excluding confusing chars like 0, O, I, 1)
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 6);

/**
 * Generate a short ID with PH- prefix
 * @returns A unique short ID like "PH-A1B2C3"
 */
export function generateShortId(): string {
  const randomPart = nanoid();
  return `PH-${randomPart}`;
}

/**
 * Validate short ID format
 * @param shortId The short ID to validate
 * @returns true if valid format (PH-XXXXXX)
 */
export function isValidShortId(shortId: string): boolean {
  const pattern = /^PH-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;
  return pattern.test(shortId);
}
