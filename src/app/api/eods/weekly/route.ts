import { db } from "@/lib/db";
import { eodReports, user, projects } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { startOfWeek, endOfDay } from "date-fns";

/**
 * GET /api/eods/weekly
 * Fetch current week's EOD reports (Monday to Today) for a specific user and project
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const userId = searchParams.get("userId");

        if (!projectId || !userId) {
            return NextResponse.json(
                { error: "projectId and userId are required" },
                { status: 400 }
            );
        }

        // Calculate current week range (Monday to Today)
        const today = new Date();
        const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const endOfToday = endOfDay(today);

        // Convert to date-only strings for comparison (YYYY-MM-DD format)
        const weekStart = new Date(startOfCurrentWeek.getFullYear(), startOfCurrentWeek.getMonth(), startOfCurrentWeek.getDate());
        const weekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Fetch EODs for the current week
        const weeklyEods = await db
            .select({
                id: eodReports.id,
                projectId: eodReports.projectId,
                userId: eodReports.userId,
                clientUpdate: eodReports.clientUpdate,
                actualUpdate: eodReports.actualUpdate,
                reportDate: eodReports.reportDate,
                createdAt: eodReports.createdAt,
                projectName: projects.name,
                userName: user.name,
            })
            .from(eodReports)
            .leftJoin(projects, eq(eodReports.projectId, projects.id))
            .leftJoin(user, eq(eodReports.userId, user.id))
            .where(
                and(
                    eq(eodReports.projectId, projectId),
                    eq(eodReports.userId, userId),
                    sql`DATE(${eodReports.reportDate}) >= DATE(${weekStart})`,
                    sql`DATE(${eodReports.reportDate}) <= DATE(${weekEnd})`
                )
            )
            .orderBy(eodReports.reportDate);

        return NextResponse.json({
            data: weeklyEods,
            meta: {
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
                total: weeklyEods.length,
            },
        });
    } catch (error) {
        console.error("[Weekly EODs API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch weekly EODs" },
            { status: 500 }
        );
    }
}
