
import { db } from "@/lib/db";
import { eodReports, memos, user, projects, userProjectAssignments } from "@/lib/db/schema";
import { eq, and, sql, between } from "drizzle-orm";
import { NextResponse } from "next/server";
import { format, startOfDay } from "date-fns";
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
        const assignments = await db.select({
            userId: userProjectAssignments.userId,
            userName: user.name,
            // userImage: user.image, // Removed for UI cleanup
            // userRole: user.role,   // Removed for UI cleanup
            projectId: userProjectAssignments.projectId,
            projectName: projects.name,
            assignedAt: userProjectAssignments.assignedAt,
            isActive: userProjectAssignments.isActive,
            lastActivatedAt: userProjectAssignments.lastActivatedAt,
        })
            .from(userProjectAssignments)
            .innerJoin(user, eq(userProjectAssignments.userId, user.id))
            .innerJoin(projects, eq(userProjectAssignments.projectId, projects.id));

        const activeOnDay = assignments.filter(a => {
            // Must be currently active
            if (!a.isActive) return false;

            // Assignment must have existed on or before this day
            const assignedDate = startOfDay(new Date(a.assignedAt));
            if (assignedDate > targetDate) return false;

            // IGNORE lastActivatedAt for past dates check if user is currently active
            // const activatedDate = startOfDay(new Date(a.lastActivatedAt || a.assignedAt));
            // if (activatedDate > targetDate) return false;

            return true;
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

        // 3. Combine to show: 
        // - All currently ACTIVE users (Submitted or Missed)
        // - Any INACTIVE users who have a submission (History)

        const activeUserProjectPairs = new Set();
        const results: any[] = [];

        // A. Add all currently ACTIVE users
        activeOnDay.forEach(a => {
            const pairId = `${a.userId}-${a.projectId}`;
            activeUserProjectPairs.add(pairId);

            const sub = submissionMap.get(pairId);
            results.push({
                user: a.userName,
                project: a.projectName,
                submittedAt: sub ? format(new Date(sub.createdAt), "h:mm a") : "-",
                status: sub ? "submitted" : "missed",
                id: sub ? sub.id : null,
                projectId: a.projectId,
                userId: a.userId,
                isActive: true
            });
        });

        // B. Add INACTIVE users who have a submission (History)
        const inactiveSubmissions = submissions.filter(s => !activeUserProjectPairs.has(`${s.userId}-${s.projectId}`));

        // Deduplicate inactive submissions (e.g. if multiple memos per user/project)
        const uniqueInactivePairs = new Map();
        inactiveSubmissions.forEach(s => {
            const pairId = `${s.userId}-${s.projectId}`;
            if (!uniqueInactivePairs.has(pairId)) {
                uniqueInactivePairs.set(pairId, s);
            }
        });

        if (uniqueInactivePairs.size > 0) {
            const uniqueInactiveList = Array.from(uniqueInactivePairs.values());
            const inactiveUserIds = uniqueInactiveList.map(s => s.userId);
            const inactiveProjectIds = uniqueInactiveList.map(s => s.projectId);

            // Fetch names for these inactive submissions
            const inactiveDetails = await db.select({
                userId: user.id,
                userName: user.name,
                projectId: projects.id,
                projectName: projects.name
            })
                .from(user)
                .innerJoin(userProjectAssignments, eq(user.id, userProjectAssignments.userId))
                .innerJoin(projects, eq(projects.id, userProjectAssignments.projectId))
                .where(
                    and(
                        sql`${user.id} IN ${inactiveUserIds}`,
                        sql`${projects.id} IN ${inactiveProjectIds}`
                    )
                );

            const paramMap = new Map();
            inactiveDetails.forEach(d => paramMap.set(`${d.userId}-${d.projectId}`, d));

            uniqueInactiveList.forEach(sub => {
                const details = paramMap.get(`${sub.userId}-${sub.projectId}`);
                if (details) {
                    results.push({
                        user: details.userName,
                        project: details.projectName,
                        submittedAt: format(new Date(sub.createdAt), "h:mm a"),
                        status: "submitted",
                        id: sub.id,
                        projectId: sub.projectId,
                        userId: sub.userId,
                        isActive: false // These are inactive users
                    });
                }
            });
        }

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
