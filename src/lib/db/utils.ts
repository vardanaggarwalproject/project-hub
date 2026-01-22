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
  // Create a range for the entire day in UTC (or the intended timezone)
  // Robust approach: Check if the timestamp is between 00:00:00 and 23:59:59 of that day
  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(targetDate);
  nextDate.setDate(targetDate.getDate() + 1);

  return sql`${dateColumn} >= ${targetDate} AND ${dateColumn} < ${nextDate}`;
}

/**
 * Create SQL clause for date range comparison
 * Modified to avoid DATE() casting for better index performance
 *
 * @param dateColumn - The database date column
 * @param from - Start date
 * @param to - End date
 * @returns SQL comparison clause
 */
export function dateRangeComparisonClause(
  dateColumn: Column | SQL,
  from: Date,
  to: Date
): SQL {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  return sql`${dateColumn} >= ${start} AND ${dateColumn} <= ${end}`;
}
