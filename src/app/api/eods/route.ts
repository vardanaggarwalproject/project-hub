
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
                conditions.push(dateRangeComparisonClause(eodReports.reportDate, start, end));
            }
        } else if (dateParam) {
            const filterDate = new Date(dateParam);
            if (!isNaN(filterDate.getTime())) {
                conditions.push(dateComparisonClause(eodReports.reportDate, filterDate));
            }
        } else if (fromDate) {
            const start = new Date(fromDate);
            if (!isNaN(start.getTime())) {
                conditions.push(dateComparisonClause(eodReports.reportDate, start));
            }
        }

        if (search) {
            conditions.push(sql`${user.name} ILIKE ${`%${search}%`}`);
        }

        conditions.push(sql`${user.role} != 'admin'`);

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        // Use grouping to ensure strict uniqueness
        const querySelection: any = {
            id: sql<string>`MAX(${eodReports.id})`,
            projectId: eodReports.projectId,
            userId: eodReports.userId,
            clientUpdate: sql<string>`MAX(${eodReports.clientUpdate})`,
            actualUpdate: sql<string>`MAX(${eodReports.actualUpdate})`,
            reportDate: eodReports.reportDate,
            createdAt: sql<Date>`MAX(${eodReports.createdAt})`,
            projectName: sql<string>`MAX(${projects.name})`,
            isMemoRequired: sql<boolean>`BOOL_OR(${projects.isMemoRequired})`,
            user: {
                id: eodReports.userId,
                name: sql<string>`MAX(${user.name})`,
                image: sql<string>`MAX(${user.image})`,
                role: sql<string>`MAX(${user.role})`
            }
        };

        const query = db.select(querySelection).from(eodReports)
            .leftJoin(user, eq(eodReports.userId, user.id))
            .leftJoin(projects, eq(eodReports.projectId, projects.id))
            .where(whereClause)
            .groupBy(
                eodReports.userId,
                eodReports.projectId,
                eodReports.reportDate
            );

        const reports = await query
            .limit(limit)
            .offset(offset)
            .orderBy(desc(sql`MAX(${eodReports.createdAt})`));

        let totalQuery = db.select({
            count: sql<number>`count(DISTINCT CONCAT(${eodReports.userId}, ${eodReports.projectId}, ${eodReports.reportDate}))`
        }).from(eodReports);

        // Join user and projects always to support filters (search, role, etc)
        totalQuery = totalQuery.leftJoin(user, eq(eodReports.userId, user.id)) as any;
        totalQuery = totalQuery.leftJoin(projects, eq(eodReports.projectId, projects.id)) as any;

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

        let result;
        let isNew = false;

        if (existing.length > 0) {
            const updatedReport = await db.update(eodReports)
                .set({
                    clientUpdate,
                    actualUpdate,
                    createdAt: new Date()
                })
                .where(eq(eodReports.id, existing[0].id))
                .returning();
            result = updatedReport[0];
        } else {
            const newReport = await db.insert(eodReports).values({
                id: crypto.randomUUID(),
                projectId,
                reportDate: dateObj,
                clientUpdate,
                actualUpdate,
                userId
            }).returning();
            result = newReport[0];
            isNew = true;
        }

        // Send notification to admins (only for new EODs, not updates) - fire-and-forget, non-blocking
        if (isNew) {
            // Don't await - let notification run in background
            import('@/lib/notifications').then(({ notificationService }) => {
                Promise.all([
                    db.select({ name: user.name }).from(user).where(eq(user.id, userId)),
                    db.select({ name: projects.name }).from(projects).where(eq(projects.id, projectId))
                ]).then(([userData, projectData]) => {
                    (notificationService as any).notifyEodSubmitted({
                        userName: userData[0]?.name || 'User',
                        projectName: projectData[0]?.name || 'Project',
                        userId,
                        content: actualUpdate || 'No content provided',
                        clientContent: clientUpdate || undefined,
                        reportDate: reportDate, // Add date for differentiation
                    });
                }).catch(err => {
                    console.error('[EOD API] Notification error:', err);
                });
            }).catch(err => {
                console.error('[EOD API] Failed to load notification service:', err);
            });
        }

        return NextResponse.json(result, { status: isNew ? 201 : 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create EOD" }, { status: 500 });
    }
}

