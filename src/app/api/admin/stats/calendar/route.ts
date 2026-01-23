import { db } from "@/lib/db";
import { eodReports, memos, user, projects, userProjectAssignments } from "@/lib/db/schema";
import { eq, and, sql, between, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWeekend, startOfWeek, endOfWeek, isAfter, startOfDay } from "date-fns";
import { dateComparisonClause } from "@/lib/db/utils";

/**
 * GET /api/admin/stats/calendar
 * Fetch aggregated stats for EODs and Memos for a given month
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // "YYYY-MM"
        const type = searchParams.get("type") || "eod"; // "eod" or "memo"

        if (!month) {
            return NextResponse.json({ error: "Month is required" }, { status: 400 });
        }

        const baseDate = new Date(month + "-01T00:00:00");
        const monthStart = startOfMonth(baseDate);
        const monthEnd = endOfMonth(baseDate);

        // Expand range to include full weeks for the calendar grid "tails"
        const fetchStart = startOfWeek(monthStart);
        const fetchEnd = endOfWeek(monthEnd);

        const [eodData, memoData] = await Promise.all([
            db.select({
                userId: eodReports.userId,
                projectId: eodReports.projectId,
                reportDate: eodReports.reportDate,
            }).from(eodReports)
                .innerJoin(user, eq(eodReports.userId, user.id))
                .where(and(
                    between(eodReports.reportDate, fetchStart, fetchEnd),
                    sql`${user.role} != 'admin'`
                )),

            db.select({
                userId: memos.userId,
                projectId: memos.projectId,
                reportDate: memos.reportDate,
            }).from(memos)
                .innerJoin(user, eq(memos.userId, user.id))
                .where(and(
                    between(memos.reportDate, fetchStart, fetchEnd),
                    sql`${user.role} != 'admin'`
                ))
        ]);

        const assignments = await db.select({
            userId: userProjectAssignments.userId,
            projectId: userProjectAssignments.projectId,
            assignedAt: userProjectAssignments.assignedAt,
            isActive: userProjectAssignments.isActive,
            lastActivatedAt: userProjectAssignments.lastActivatedAt,
        }).from(userProjectAssignments)
            .innerJoin(user, eq(userProjectAssignments.userId, user.id))
            .where(sql`${user.role} != 'admin'`);

        const days = eachDayOfInterval({ start: fetchStart, end: fetchEnd });
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        const stats = days.map((day) => {
            // Use UTC/ISO date string to avoid timezone shifting when grouping
            const dateStr = format(day, "yyyy-MM-dd");
            const isDayWeekend = isWeekend(day);
            const isFuture = isAfter(day, todayAtMidnight);
            const dayStart = startOfDay(day);

            // Filter submissions for this day (normalize reportDate to compare only YYYY-MM-DD)
            const dayEods = eodData.filter(e => format(new Date(e.reportDate), "yyyy-MM-dd") === dateStr);
            const dayMemos = memoData.filter(m => format(new Date(m.reportDate), "yyyy-MM-dd") === dateStr);

            // Submissions for the requested type (EOD or Memo)
            const currentSubmissions = type === "eod" ? dayEods : dayMemos;

            // Unique users who submitted the current type
            // const uniqueUsersSubmittedCurrent = new Set(currentSubmissions.map(s => s.userId));

            // Unique users who submitted BOTH (EOD and Memo)
            // This is for the "userCount" requirement: "users who have submitted their eod and memo"
            const uniqueUsersEod = new Set(dayEods.map(e => e.userId));
            const uniqueUsersMemo = new Set(dayMemos.map(m => m.userId));
            const usersSubmittedBoth = Array.from(uniqueUsersEod).filter(uId => uniqueUsersMemo.has(uId));

            // Missed calculation: 
            // Only consider assignments that are CURRENTLY ACTIVE.
            // And where the 'lastActivatedAt' is <= day.
            // This means we don't count "missed" for days before they last activated the project.
            // 1. Identify ALL uniquely submitted pairs (User + Project)
            // This includes BOTH Active and Inactive users (Historical Data)
            // Using a Set ensures that if a user submitted 2 memos (short + universal), it counts as 1.
            const uniquePairsSubmitted = new Set(currentSubmissions.map(s => `${s.userId}-${s.projectId}`));

            // 2. Identify Assignments that were ACTIVE on this day
            const activeAssignmentsOnDay = assignments.filter(a => {
                const assignedDate = startOfDay(new Date(a.assignedAt));
                // Must be currently active AND assigned on/before this day
                if (!a.isActive) return false;
                if (assignedDate > day) return false;
                return true;
            });

            // 3. Calculate "Missed" 
            // Definition: Users who are CURRENTLY ACTIVE but did NOT submit.
            // Inactive users are NOT counted as missed, even if they have no submission.
            let missedCount = 0;
            const uniquePairsActive = new Set(activeAssignmentsOnDay.map(a => `${a.userId}-${a.projectId}`));

            if (!isFuture && !isDayWeekend) {
                // Check which ACTIVE assignments are NOT in the submitted set
                missedCount = Array.from(uniquePairsActive).filter(pair => !uniquePairsSubmitted.has(pair)).length;
            }

            return {
                date: day.toISOString(),
                submittedCount: isFuture ? 0 : uniquePairsSubmitted.size, // Count unique pairs (fixes memo double count + includes inactive)
                missedCount: missedCount,
                userCount: isFuture ? 0 : usersSubmittedBoth.length,
                projectCount: isFuture ? 0 : new Set(activeAssignmentsOnDay.map(a => a.projectId)).size,
                isWeekend: isDayWeekend,
                isFuture: isFuture
            };
        });

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
