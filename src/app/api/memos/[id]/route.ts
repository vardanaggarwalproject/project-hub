import { db } from "@/lib/db";
import { memos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { memoSchema } from "@/lib/validations/reports";
import { dateComparisonClause } from "@/lib/db/utils";

/**
 * PUT /api/memos/[id]
 * Update an existing memo
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = memoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const { memoContent, projectId, userId, reportDate } = validation.data;

    // Convert to Date object
    const dateObj = new Date(reportDate);
    dateObj.setHours(0, 0, 0, 0);

    // Check if another memo exists for this user+project+date (excluding current memo)
    const existing = await db
      .select()
      .from(memos)
      .where(
        and(
          eq(memos.userId, userId),
          eq(memos.projectId, projectId),
          dateComparisonClause(memos.reportDate, dateObj)
        )
      );

    // Filter out the current memo being updated
    const duplicates = existing.filter((m) => m.id !== id);

    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: "Memo already exists for this date" },
        { status: 409 }
      );
    }

    // Update the memo
    const updatedMemo = await db
      .update(memos)
      .set({
        memoContent,
        projectId,
        reportDate: dateObj,
        updatedAt: new Date(),
      })
      .where(eq(memos.id, id))
      .returning();

    if (updatedMemo.length === 0) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMemo[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update memo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memos/[id]
 * Delete a memo
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleted = await db.delete(memos).where(eq(memos.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete memo" },
      { status: 500 }
    );
  }
}
