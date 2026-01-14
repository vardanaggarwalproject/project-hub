
import { db } from "@/lib/db";
import { eodReports, user, projects } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
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
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        let whereClause = undefined;
        const conditions = [];

        if (projectId) conditions.push(eq(eodReports.projectId, projectId));
        if (userId) conditions.push(eq(eodReports.userId, userId));
        if (search) {
            conditions.push(sql`(${eodReports.clientUpdate} ILIKE ${`%${search}%`} OR ${eodReports.actualUpdate} ILIKE ${`%${search}%`} OR ${user.name} ILIKE ${`%${search}%`})`);
        }

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
            projectName: projects.name,
            user: {
                id: user.id,
                name: user.name,
                image: user.image,
                role: user.role
            }
        })
            .from(eodReports)
            .leftJoin(user, eq(eodReports.userId, user.id))
            .leftJoin(projects, eq(eodReports.projectId, projects.id))
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(eodReports.reportDate));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(eodReports)
            .where(whereClause);

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
