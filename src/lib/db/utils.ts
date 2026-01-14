import { sql, type SQL, type Column } from "drizzle-orm";

/**
 * Database utility functions for common query patterns
 */

/**
 * Create SQL clause for date comparison in UTC timezone
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
  const isoString = dateObj.toISOString();
  return sql`DATE(${dateColumn} AT TIME ZONE 'UTC') = DATE(${isoString}::timestamp AT TIME ZONE 'UTC')`;
}
