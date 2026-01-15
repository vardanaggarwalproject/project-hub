import { sql, type SQL, type Column } from "drizzle-orm";

/**
 * Database utility functions for common query patterns
 */

/**
 * Create SQL clause for date comparison
 * Used to compare dates regardless of time component
 *
 * @param dateColumn - The database date column
 * @param dateObj - The Date object to compare against
 * @returns SQL comparison clause
 */
export function dateComparisonClause(
  dateColumn: Column | SQL,
  dateObj: Date
): SQL {
  // Extract date in yyyy-MM-dd format without timezone conversion
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  return sql`DATE(${dateColumn}) = DATE(${dateString})`;
}
