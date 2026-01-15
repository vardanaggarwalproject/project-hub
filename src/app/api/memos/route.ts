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
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
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

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const allMemos = await db.select({
            id: memos.id,
            memoContent: memos.memoContent,
            projectId: memos.projectId,
            userId: memos.userId,
            reportDate: memos.reportDate,
            createdAt: memos.createdAt,
            projectName: projects.name,
            user: {
                id: user.id,
                name: user.name,
                image: user.image,
                role: user.role
            }
        })
            .from(memos)
            .leftJoin(user, eq(memos.userId, user.id))
            .leftJoin(projects, eq(memos.projectId, projects.id))
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(memos.createdAt));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(memos)
            .leftJoin(user, eq(memos.userId, user.id))
            .leftJoin(projects, eq(memos.projectId, projects.id))
            .where(whereClause);

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
 * Create a new memo with duplicate checking
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = memoSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { memoContent, projectId, userId, reportDate } = validation.data;

        // Convert to Date object - this preserves the date in local timezone
        // We append T00:00:00 to ensure it's treated as a local date at midnight
        const dateObj = new Date(reportDate + "T00:00:00");

        // Check if memo exists for this user+project+date - compare date parts at UTC
        const existing = await db.select().from(memos)
            .where(and(
                eq(memos.userId, userId),
                eq(memos.projectId, projectId),
                dateComparisonClause(memos.reportDate, dateObj)
            ));

        if (existing.length > 0) {
            return NextResponse.json({ error: "Memo already exists for this date" }, { status: 409 });
        }

        const newMemo = await db.insert(memos).values({
            id: crypto.randomUUID(),
            projectId,
            reportDate: dateObj,
            memoContent,
            userId
        }).returning();

        return NextResponse.json(newMemo[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create memo" }, { status: 500 });
    }
}
