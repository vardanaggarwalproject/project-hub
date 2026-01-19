
import { db } from "@/lib/db";
import { eodReports, memos, user, projects, userProjectAssignments } from "@/lib/db/schema";
import { eq, and, sql, between } from "drizzle-orm";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { dateComparisonClause } from "@/lib/db/utils";

/**
 * GET /api/admin/stats/day-details
 * Fetch detail list for a specific day: who submitted and who missed
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date"); // "YYYY-MM-DD"
        const type = searchParams.get("type") || "eod";

        if (!dateParam) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        const targetDate = new Date(dateParam + "T00:00:00");
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        if (targetDate > todayAtMidnight) {
            return NextResponse.json([]); // No details for future dates
        }
        // 1. Fetch all active assignments for that date
        // (Similar logic to calendar stats)
        const assignments = await db.select({
            userId: userProjectAssignments.userId,
            userName: user.name,
            projectId: userProjectAssignments.projectId,
            projectName: projects.name,
            assignedAt: userProjectAssignments.assignedAt,
        })
            .from(userProjectAssignments)
            .innerJoin(user, eq(userProjectAssignments.userId, user.id))
            .innerJoin(projects, eq(userProjectAssignments.projectId, projects.id));

        const activeOnDay = assignments.filter(a => {
            const assigned = new Date(a.assignedAt);
            assigned.setHours(0, 0, 0, 0);
            return assigned <= targetDate;
        });

        // 2. Fetch submissions for that date
        let submissions: any[] = [];
        if (type === "eod") {
            submissions = await db.select({
                id: eodReports.id,
                userId: eodReports.userId,
                projectId: eodReports.projectId,
                createdAt: eodReports.createdAt,
            })
                .from(eodReports)
                .where(dateComparisonClause(eodReports.reportDate, targetDate));
        } else {
            submissions = await db.select({
                id: memos.id,
                userId: memos.userId,
                projectId: memos.projectId,
                createdAt: memos.createdAt,
            })
                .from(memos)
                .where(dateComparisonClause(memos.reportDate, targetDate));
        }

        const submissionMap = new Map();
        submissions.forEach(s => {
            submissionMap.set(`${s.userId}-${s.projectId}`, s);
        });

        // 3. Combine to show all active users for those projects
        const results = activeOnDay.map(a => {
            const sub = submissionMap.get(`${a.userId}-${a.projectId}`);
            return {
                user: a.userName,
                project: a.projectName,
                submittedAt: sub ? format(new Date(sub.createdAt), "h:mm a") : "-",
                status: sub ? "submitted" : "missed",
                id: sub ? sub.id : null,
                projectId: a.projectId,
                userId: a.userId
            };
        });

        // Sort by submitted first, then name
        results.sort((a, b) => {
            if (a.status === b.status) return a.user.localeCompare(b.user);
            return a.status === "submitted" ? -1 : 1;
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error("Day details error:", error);
        return NextResponse.json({ error: "Failed to fetch day details" }, { status: 500 });
    }
}
