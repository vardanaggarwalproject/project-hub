import { db } from "@/lib/db";
import { memos, user } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { memoSchema } from "@/lib/validations/reports";
import { dateComparisonClause } from "@/lib/db/utils";

/**
 * GET /api/memos
 * Fetch memos filtered by projectId and/or userId
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const userId = searchParams.get("userId");

        let whereClause = undefined;
        const conditions = [];

        if (projectId) conditions.push(eq(memos.projectId, projectId));
        if (userId) conditions.push(eq(memos.userId, userId));

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
            user: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
            .from(memos)
            .leftJoin(user, eq(memos.userId, user.id))
            .where(whereClause)
            .orderBy(desc(memos.reportDate));

        return NextResponse.json(allMemos);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch memos" }, { status: 500 });
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
        const dateObj = new Date(reportDate);
        dateObj.setHours(0, 0, 0, 0);

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
            reportDate: dateObj.toISOString(),
            memoContent,
            userId
        }).returning();

        return NextResponse.json(newMemo[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create memo" }, { status: 500 });
    }
}
