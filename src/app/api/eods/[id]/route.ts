import { db } from "@/lib/db";
import { eodReports, user, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { eodSchema } from "@/lib/validations/reports";
import { dateComparisonClause } from "@/lib/db/utils";

/**
 * GET /api/eods/[id]
 * Fetch a single EOD report with details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await db.select({
      id: eodReports.id,
      clientUpdate: eodReports.clientUpdate,
      actualUpdate: eodReports.actualUpdate,
      hoursSpent: eodReports.hoursSpent,
      reportDate: eodReports.reportDate,
      createdAt: eodReports.createdAt,
      projectId: eodReports.projectId,
      userId: eodReports.userId,
      projectName: projects.name,
      isMemoRequired: projects.isMemoRequired,
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
      .where(eq(eodReports.id, id))
      .limit(1);

    if (report.length === 0) {
      return NextResponse.json({ error: "EOD not found" }, { status: 404 });
    }

    return NextResponse.json(report[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch EOD" }, { status: 500 });
  }
}

/**
 * PUT /api/eods/[id]
 * Update an existing EOD
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = eodSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const { clientUpdate, actualUpdate, hoursSpent, projectId, userId, reportDate } =
      validation.data;

    // Convert to Date object
    // We append T00:00:00 to ensure it's treated as a local date at midnight
    const dateObj = new Date(reportDate + "T00:00:00");

    // Check if another EOD exists for this user+project+date (excluding current EOD)
    const existing = await db
      .select()
      .from(eodReports)
      .where(
        and(
          eq(eodReports.userId, userId),
          eq(eodReports.projectId, projectId),
          dateComparisonClause(eodReports.reportDate, dateObj)
        )
      );

    // Filter out the current EOD being updated
    const duplicates = existing.filter((e) => e.id !== id);

    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: "EOD already exists for this date" },
        { status: 409 }
      );
    }

    // Update the EOD
    const updatedEod = await db
      .update(eodReports)
      .set({
        clientUpdate: clientUpdate || "",
        actualUpdate,
        hoursSpent,
        projectId,
        reportDate: dateObj,
        updatedAt: new Date(),
      })
      .where(eq(eodReports.id, id))
      .returning();

    if (updatedEod.length === 0) {
      return NextResponse.json({ error: "EOD not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEod[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update EOD" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/eods/[id]
 * Delete an EOD
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleted = await db
      .delete(eodReports)
      .where(eq(eodReports.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "EOD not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete EOD" },
      { status: 500 }
    );
  }
}
