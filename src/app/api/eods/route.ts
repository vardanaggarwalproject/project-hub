
import { db } from "@/lib/db";
import { eodReports, user, projects } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { eodSchema } from "@/lib/validations/reports";
import { dateComparisonClause, dateRangeComparisonClause } from "@/lib/db/utils";

/**
 * GET /api/eods
 * Fetch EOD reports filtered by projectId and/or userId
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const userId = searchParams.get("userId");
        const search = searchParams.get("search");
        const summary = searchParams.get("summary") === "true";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        let whereClause = undefined;
        const conditions = [];

        if (projectId) conditions.push(eq(eodReports.projectId, projectId));
        if (userId) conditions.push(eq(eodReports.userId, userId));

        // Handle date range or single date filtering using createdAt (Submission Date)
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");
        const dateParam = searchParams.get("date");

        if (fromDate && toDate) {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                conditions.push(dateRangeComparisonClause(eodReports.createdAt, start, end));
            }
        } else if (dateParam) {
            const filterDate = new Date(dateParam);
            if (!isNaN(filterDate.getTime())) {
                conditions.push(dateComparisonClause(eodReports.createdAt, filterDate));
            }
        } else if (fromDate) {
            const start = new Date(fromDate);
            if (!isNaN(start.getTime())) {
                conditions.push(dateComparisonClause(eodReports.createdAt, start));
            }
        }

        if (search) {
            conditions.push(sql`${user.name} ILIKE ${`%${search}%`}`);
        }

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const querySelection: any = {
            id: eodReports.id,
            projectId: eodReports.projectId,
            userId: eodReports.userId,
            clientUpdate: eodReports.clientUpdate,
            actualUpdate: eodReports.actualUpdate,
            reportDate: eodReports.reportDate,
            createdAt: eodReports.createdAt,
        };

        if (!summary) {
            querySelection.projectName = projects.name;
            querySelection.isMemoRequired = projects.isMemoRequired;
            querySelection.user = {
                id: user.id,
                name: user.name,
                image: user.image,
                role: user.role
            };
        }

        let query = db.select(querySelection).from(eodReports);

        if (!summary) {
            query = query.leftJoin(user, eq(eodReports.userId, user.id)) as any;
            query = query.leftJoin(projects, eq(eodReports.projectId, projects.id)) as any;
        }

        const reports = await query
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(eodReports.createdAt));

        let totalQuery = db.select({ count: sql<number>`count(*)` }).from(eodReports);

        // If we have filters that require joining other tables (like search by user name)
        if (search) {
            totalQuery = totalQuery.leftJoin(user, eq(eodReports.userId, user.id)) as any;
        }

        const totalResult = await totalQuery.where(whereClause);

        const total = Number(totalResult[0]?.count || 0);

        return NextResponse.json({
            data: reports,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
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
        // We append T00:00:00 to ensure it's treated as a local date at midnight
        const dateObj = new Date(reportDate + "T00:00:00");

        // Check duplicate - compare date parts at UTC
        const existing = await db.select().from(eodReports)
            .where(and(
                eq(eodReports.userId, userId),
                eq(eodReports.projectId, projectId),
                dateComparisonClause(eodReports.reportDate, dateObj)
            ));

        if (existing.length > 0) {
            const updatedReport = await db.update(eodReports)
                .set({
                    clientUpdate,
                    actualUpdate,
                    createdAt: new Date() // Treat update as a new submission date? Or keep original?
                    // The user says "they are also correctly update with that" referring to dates.
                    // So updating createdAt (submitted date) seems correct.
                })
                .where(eq(eodReports.id, existing[0].id))
                .returning();
            return NextResponse.json(updatedReport[0], { status: 200 });
        }

        const newReport = await db.insert(eodReports).values({
            id: crypto.randomUUID(),
            projectId,
            reportDate: dateObj,
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
