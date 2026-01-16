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
        const summary = searchParams.get("summary") === "true";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const isMemoRequiredParam = searchParams.get("isMemoRequired");
        const offset = (page - 1) * limit;

        let whereClause = undefined;
        const conditions = [];

        if (projectId) conditions.push(eq(memos.projectId, projectId));
        if (userId) conditions.push(eq(memos.userId, userId));

        // Handle date range or single date filtering using createdAt (Submission Date)
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");
        const dateParam = searchParams.get("date");

        if (fromDate && toDate) {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                conditions.push(dateRangeComparisonClause(memos.createdAt, start, end));
            }
        } else if (dateParam) {
            const filterDate = new Date(dateParam);
            if (!isNaN(filterDate.getTime())) {
                conditions.push(dateComparisonClause(memos.createdAt, filterDate));
            }
        } else if (fromDate) {
            const start = new Date(fromDate);
            if (!isNaN(start.getTime())) {
                conditions.push(dateComparisonClause(memos.createdAt, start));
            }
        }

        if (search) {
            conditions.push(sql`${user.name} ILIKE ${`%${search}%`}`);
        }

        if (isMemoRequiredParam !== null) {
            conditions.push(eq(projects.isMemoRequired, isMemoRequiredParam === "true"));
        }

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const querySelection: any = {
            id: memos.id,
            memoContent: memos.memoContent,
            memoType: memos.memoType,
            projectId: memos.projectId,
            userId: memos.userId,
            reportDate: memos.reportDate,
            createdAt: memos.createdAt,
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

        let query = db.select(querySelection).from(memos);

        if (!summary) {
            query = query.leftJoin(user, eq(memos.userId, user.id)) as any;
            query = query.leftJoin(projects, eq(memos.projectId, projects.id)) as any;
        }

        const allMemos = await query
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(memos.createdAt));

        let totalQuery = db.select({ count: sql<number>`count(*)` }).from(memos);

        // If we have filters that require the projects table, we must join it
        if (isMemoRequiredParam !== null || search) {
            totalQuery = totalQuery.leftJoin(user, eq(memos.userId, user.id)) as any;
            totalQuery = totalQuery.leftJoin(projects, eq(memos.projectId, projects.id)) as any;
        }

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

async function saveMemo(data: any) {
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
        // Update instead of error? The user wants optimization. 
        // If it exists, let's update it.
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

    return newMemo[0];
}
