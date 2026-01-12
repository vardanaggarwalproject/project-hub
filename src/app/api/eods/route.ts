
import { db } from "@/lib/db";
import { eodReports, user } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { eodSchema } from "@/lib/validations/reports";
import { dateComparisonClause } from "@/lib/db/utils";

/**
 * GET /api/eods
 * Fetch EOD reports filtered by projectId and/or userId
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const userId = searchParams.get("userId");

        let whereClause = undefined;
        const conditions = [];

        if (projectId) conditions.push(eq(eodReports.projectId, projectId));
        if (userId) conditions.push(eq(eodReports.userId, userId));

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const reports = await db.select({
            id: eodReports.id,
            projectId: eodReports.projectId,
            userId: eodReports.userId,
            clientUpdate: eodReports.clientUpdate,
            actualUpdate: eodReports.actualUpdate,
            reportDate: eodReports.reportDate,
            createdAt: eodReports.createdAt,
            user: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
            .from(eodReports)
            .leftJoin(user, eq(eodReports.userId, user.id))
            .where(whereClause)
            .orderBy(desc(eodReports.reportDate));

        return NextResponse.json(reports);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch EODs" }, { status: 500 });
    }
}

/**
 * POST /api/eods
 * Create a new EOD report with duplicate checking
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = eodSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { clientUpdate, actualUpdate, projectId, userId, reportDate } = validation.data;

        // Convert to Date object - this preserves the date in local timezone
        const dateObj = new Date(reportDate);
        dateObj.setHours(0, 0, 0, 0);

        // Check duplicate - compare date parts at UTC
        const existing = await db.select().from(eodReports)
            .where(and(
                eq(eodReports.userId, userId),
                eq(eodReports.projectId, projectId),
                dateComparisonClause(eodReports.reportDate, dateObj)
            ));

        if (existing.length > 0) {
            return NextResponse.json({ error: "EOD already exists for this date" }, { status: 409 });
        }

        const newReport = await db.insert(eodReports).values({
            id: crypto.randomUUID(),
            projectId,
            reportDate: dateObj.toISOString(),
            clientUpdate,
            actualUpdate,
            userId
        }).returning();

        return NextResponse.json(newReport[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create EOD" }, { status: 500 });
    }
}
