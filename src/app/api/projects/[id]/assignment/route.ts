import { db } from "@/lib/db";
import { userProjectAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/assignment
 * Fetch project assignment details for a specific user
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const assignment = await db
            .select({
                assignedAt: userProjectAssignments.assignedAt,
                isActive: userProjectAssignments.isActive,
            })
            .from(userProjectAssignments)
            .where(
                and(
                    eq(userProjectAssignments.projectId, id),
                    eq(userProjectAssignments.userId, userId)
                )
            )
            .limit(1);

        if (assignment.length === 0) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(assignment[0]);
    } catch (error) {
        console.error("Error fetching assignment:", error);
        return NextResponse.json(
            { error: "Failed to fetch assignment" },
            { status: 500 }
        );
    }
}
