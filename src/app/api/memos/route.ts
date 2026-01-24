import { db } from "@/lib/db";
import { memos, user, projects } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { memoSchema } from "@/lib/validations/reports";
import { dateComparisonClause, dateRangeComparisonClause } from "@/lib/db/utils";

/**
 * GET /api/memos
 * Fetch memos filtered by projectId and/or userId
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const userId = searchParams.get("userId");
        const search = searchParams.get("search");
        const summary = searchParams.get("summary") === "true"; // If true, return grouped data (but now we group by default for list too?)
        // Actually, for the main list, we ALWAYS want grouped data to avoid duplicates (Universal + Short).
        // But the 'summary' param was previously used for detailed view to get BOTH types.
        // Let's make the default behavior "Grouped" for the list view, but ensure we return enough data.

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const isMemoRequiredParam = searchParams.get("isMemoRequired");
        const offset = (page - 1) * limit;

        let whereClause = undefined;
        const conditions = [];

        if (projectId) conditions.push(eq(memos.projectId, projectId));
        if (userId) conditions.push(eq(memos.userId, userId));

        // Handle date range or single date filtering
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");
        const dateParam = searchParams.get("date");

        if (fromDate && toDate) {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                conditions.push(dateRangeComparisonClause(memos.reportDate, start, end));
            }
        } else if (dateParam) {
            const filterDate = new Date(dateParam);
            if (!isNaN(filterDate.getTime())) {
                conditions.push(dateComparisonClause(memos.reportDate, filterDate));
            }
        } else if (fromDate) {
            const start = new Date(fromDate);
            if (!isNaN(start.getTime())) {
                conditions.push(dateComparisonClause(memos.reportDate, start));
            }
        }

        if (search) {
            conditions.push(sql`${user.name} ILIKE ${`%${search}%`}`);
        }

        if (isMemoRequiredParam !== null) {
            conditions.push(eq(projects.isMemoRequired, isMemoRequiredParam === "true"));
        }

        conditions.push(sql`${user.role} != 'admin'`);

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        // If summary is true, we want individual records (detailed view)
        // If summary is false, we want grouped records (list view, to avoid duplicates)

        const querySelection: any = summary ? {
            id: memos.id,
            memoContent: memos.memoContent,
            memoType: memos.memoType,
            projectId: memos.projectId,
            userId: memos.userId,
            reportDate: memos.reportDate,
            createdAt: memos.createdAt,
            projectName: projects.name,
            isMemoRequired: projects.isMemoRequired,
            user: {
                id: user.id,
                name: user.name,
                image: user.image,
                role: user.role
            }
        } : {
            id: sql<string>`MAX(${memos.id})`, // Just pick one ID for key
            memoContent: sql<string>`COALESCE(MAX(CASE WHEN ${memos.memoType} = 'universal' THEN ${memos.memoContent} END), MAX(${memos.memoContent}))`,
            memoType: sql<string>`MAX(${memos.memoType})`, // Represents one of them
            projectId: memos.projectId,
            userId: memos.userId,
            reportDate: memos.reportDate,
            createdAt: sql<Date>`MAX(${memos.createdAt})`,
            projectName: sql<string>`MAX(${projects.name})`,
            isMemoRequired: sql<boolean>`BOOL_OR(${projects.isMemoRequired})`,
            user: {
                id: memos.userId,
                name: sql<string>`MAX(${user.name})`,
                image: sql<string>`MAX(${user.image})`,
                role: sql<string>`MAX(${user.role})`
            }
        };

        const baseQuery = db.select(querySelection).from(memos)
            .leftJoin(user, eq(memos.userId, user.id))
            .leftJoin(projects, eq(memos.projectId, projects.id))
            .where(whereClause);

        const query = summary
            ? baseQuery
            : baseQuery.groupBy(
                memos.userId,
                memos.projectId,
                memos.reportDate,
            );

        // Sorting
        const orderByClause = summary
            ? desc(memos.createdAt)
            : desc(sql`MAX(${memos.createdAt})`);

        const allMemos = await query
            .limit(limit)
            .offset(offset)
            .orderBy(orderByClause);

        // Count distinct groups for pagination
        let totalQuery = db.select({
            count: sql<number>`count(DISTINCT CONCAT(${memos.userId}, ${memos.projectId}, ${memos.reportDate}))`
        }).from(memos);

        // Join user and projects always to support filters (search, role, etc)
        totalQuery = totalQuery.leftJoin(user, eq(memos.userId, user.id)) as any;
        totalQuery = totalQuery.leftJoin(projects, eq(memos.projectId, projects.id)) as any;

        const totalResult = await totalQuery.where(whereClause);
        const total = Number(totalResult[0]?.count || 0);

        return NextResponse.json({
            data: allMemos,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching memos:", error);
        return NextResponse.json({
            error: "Failed to fetch memos",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * POST /api/memos
 * Create or update memos with duplicate checking
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Handle potential dual save (bulk)
        if (body.memos && Array.isArray(body.memos)) {
            const results = [];
            for (const memoData of body.memos) {
                const res = await saveMemo(memoData);
                results.push(res);
            }
            return NextResponse.json(results, { status: 201 });
        }

        const result = await saveMemo(body);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to process memo" }, { status: 500 });
    }
}

async function saveMemo(data: { memoContent?: string; projectId: string; userId: string; reportDate: string; memoType?: string }) {
    const validation = memoSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.issues, status: 400 };
    }

    const { memoContent, projectId, userId, reportDate, memoType = 'short' } = validation.data;
    const dateObj = new Date(reportDate + "T00:00:00");

    // Check if memo exists for this user+project+date+type
    const existing = await db.select().from(memos)
        .where(and(
            eq(memos.userId, userId),
            eq(memos.projectId, projectId),
            eq(memos.memoType, memoType),
            dateComparisonClause(memos.reportDate, dateObj)
        ));

    if (existing.length > 0) {
        // Update existing memo
        const updated = await db.update(memos)
            .set({
                memoContent,
                updatedAt: new Date()
            })
            .where(eq(memos.id, existing[0].id))
            .returning();
        return updated[0];
    }

    const newMemo = await db.insert(memos).values({
        id: crypto.randomUUID(),
        projectId,
        reportDate: dateObj,
        memoContent,
        memoType,
        userId
    }).returning();

    // Send notification to admins for new memos
    try {
        const { notificationService } = await import('@/lib/notifications');

        // Fetch user and project names for notification
        const [userData] = await db.select({ name: user.name }).from(user).where(eq(user.id, userId));
        const [projectData] = await db.select({ name: projects.name }).from(projects).where(eq(projects.id, projectId));

        await notificationService.notifyMemoSubmitted({
            userName: userData?.name || 'User',
            projectName: projectData?.name || 'Project',
            userId,
            memoType,
            content: memoContent || 'No content provided',
        });
    } catch (notifyError) {
        // Don't fail the request if notification fails
        console.error('[Memo API] Notification error:', notifyError);
    }

    return newMemo[0];
}

