import { db } from "@/lib/db";
import { eodReports, memos, user, projects, userProjectAssignments } from "@/lib/db/schema";
import { eq, and, sql, between, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWeekend, startOfWeek, endOfWeek, isAfter } from "date-fns";
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

        // 1. Fetch all submissions for the extended range
        const [eodData, memoData] = await Promise.all([
            db.select({
                userId: eodReports.userId,
                projectId: eodReports.projectId,
                reportDate: eodReports.reportDate,
            }).from(eodReports)
                .where(between(eodReports.reportDate, fetchStart, fetchEnd)),

            db.select({
                userId: memos.userId,
                projectId: memos.projectId,
                reportDate: memos.reportDate,
            }).from(memos)
                .where(between(memos.reportDate, fetchStart, fetchEnd))
        ]);

        // 2. Fetch all active project assignments
        const assignments = await db.select({
            userId: userProjectAssignments.userId,
            projectId: userProjectAssignments.projectId,
            assignedAt: userProjectAssignments.assignedAt,
        }).from(userProjectAssignments);

        const days = eachDayOfInterval({ start: fetchStart, end: fetchEnd });
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        const stats = days.map((day) => {
            // Use UTC/ISO date string to avoid timezone shifting when grouping
            const dateStr = format(day, "yyyy-MM-dd");
            const isDayWeekend = isWeekend(day);
            const isFuture = isAfter(day, todayAtMidnight);

            // Filter submissions for this day (normalize reportDate to compare only YYYY-MM-DD)
            const dayEods = eodData.filter(e => format(new Date(e.reportDate), "yyyy-MM-dd") === dateStr);
            const dayMemos = memoData.filter(m => format(new Date(m.reportDate), "yyyy-MM-dd") === dateStr);

            // Submissions for the requested type (EOD or Memo)
            const currentSubmissions = type === "eod" ? dayEods : dayMemos;

            // Unique users who submitted the current type
            const uniqueUsersSubmittedCurrent = new Set(currentSubmissions.map(s => s.userId));

            // Unique users who submitted BOTH (EOD and Memo)
            // This is for the "userCount" requirement: "users who have submitted their eod and memo"
            const uniqueUsersEod = new Set(dayEods.map(e => e.userId));
            const uniqueUsersMemo = new Set(dayMemos.map(m => m.userId));
            const usersSubmittedBoth = Array.from(uniqueUsersEod).filter(uId => uniqueUsersMemo.has(uId));

            // Missed calculation: 
            // We need to know which assignments were active on this day.
            // For simplicity, we check: assignedAt <= day AND (if today or past, isActive is true or lastActivatedAt <= day)
            // Actually, we'll just check if assignedAt <= day. 
            // Better logic: if the assignment exists and was assigned before/on this day.
            // And it should not be weekend (unless it's today and they submitted).
            const activeAssignmentsOnDay = assignments.filter(a => {
                const assignedDate = new Date(a.assignedAt);
                assignedDate.setHours(0, 0, 0, 0);
                return assignedDate <= day;
            });

            const uniquePairsActive = new Set(activeAssignmentsOnDay.map(a => `${a.userId}-${a.projectId}`));
            const uniquePairsSubmitted = new Set(currentSubmissions.map(s => `${s.userId}-${s.projectId}`));

            // missedCount: Active assignments that have no submission for the current type
            let missedCount = 0;
            // Only count "missed" for past/today and non-weekends
            if (!isFuture && !isDayWeekend) {
                missedCount = Array.from(uniquePairsActive).filter(pair => !uniquePairsSubmitted.has(pair)).length;
            }

            return {
                date: day.toISOString(),
                submittedCount: isFuture ? 0 : currentSubmissions.length,
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
