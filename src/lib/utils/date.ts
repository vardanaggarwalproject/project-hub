/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Format Date object to YYYY-MM-DD
 * @param date - Date object to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * @returns Today's date as a string
 */
export function getTodayDate(): string {
  const today = new Date();
  return formatDateToYYYYMMDD(today);
}

/**
 * Get yesterday's date in YYYY-MM-DD format (local timezone)
 * @returns Yesterday's date as a string
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateToYYYYMMDD(yesterday);
}

/**
 * Convert timestamp to local date string (YYYY-MM-DD)
 * @param dateInput - Date object or UTC timestamp string
 * @returns Local date string in YYYY-MM-DD format (safe from timezone shifts for midnight UTC)
 */
export function getLocalDateString(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  // Use local methods to get the date parts. 
  // This ensures that if a Date object represents "Today at 00:00 Local", 
  // it returns "Today's" date string, regardless of UTC offset.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Mon, Jan 15, 2026")
 * @param dateInput - Date object or string in YYYY-MM-DD format
 * @returns Formatted display date
 */
export function formatDisplayDate(dateInput: Date | string): string {
  const date = typeof dateInput === "string"
    ? new Date(dateInput + "T00:00:00")
    : dateInput;

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
