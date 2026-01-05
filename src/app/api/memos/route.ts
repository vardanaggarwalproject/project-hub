
import { db } from "@/lib/db";
import { memos } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth"; // Need session for userId

const memoSchema = z.object({
    memoContent: z.string().max(140, "Max 140 characters").min(1),
    projectId: z.string().uuid().or(z.string()),
    userId: z.string().uuid().or(z.string()), // Passed from client or extracted from session
    reportDate: z.string().or(z.date()), // Expecting ISO date string
});

export async function GET(req: Request) {
    try {
        const allMemos = await db.select().from(memos); 
        // TODO: Filter by user/project via query params
        return NextResponse.json(allMemos);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch memos" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = memoSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors }, { status: 400 });
        }

        const { memoContent, projectId, userId, reportDate } = validation.data;
        
        // Convert reportDate to Date object and strip time for comparison
        const dateObj = new Date(reportDate);
        dateObj.setHours(0, 0, 0, 0);

        // Check if memo exists for this user+project+date
        // Complex checking might require 'sql' operator to match date part if stored as timestamp
        // For now trusting simple comparison or we query range
        
        const existing = await db.select().from(memos)
            .where(and(
                eq(memos.userId, userId),
                eq(memos.projectId, projectId),
                sql`DATE(${memos.reportDate}) = DATE(${dateObj.toISOString()})`
            ));

        if (existing.length > 0) {
            return NextResponse.json({ error: "Memo already exists for this date" }, { status: 409 });
        }

        const newMemo = await db.insert(memos).values({
            id: crypto.randomUUID(),
            memoContent,
            userId,
            projectId,
            reportDate: dateObj,
        }).returning();

        return NextResponse.json(newMemo[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create memo" }, { status: 500 });
    }
}
