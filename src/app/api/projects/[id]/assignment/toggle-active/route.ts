import { db } from "@/lib/db";
import { userProjectAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { UserRole } from "@/types";

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/projects/[id]/assignment/toggle-active
 * Toggle the active status of a project assignment
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: projectId } = await params;
        const { userId, isActive } = await req.json();

        // Check permissions: admins can toggle for anyone, users can only toggle their own
        const userRole = session.user.role as UserRole;
        const isAdmin = userRole === 'admin';
        if (!isAdmin && session.user.id !== userId) {
            return NextResponse.json(
                { error: "You can only manage your own active projects" },
                { status: 403 }
            );
        }

        // Update the assignment
        const updated = await db
            .update(userProjectAssignments)
            .set({
                isActive: isActive,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(userProjectAssignments.projectId, projectId),
                    eq(userProjectAssignments.userId, userId)
                )
            )
            .returning();

        if (updated.length === 0) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            isActive: updated[0].isActive
        });
    } catch (error: any) {
        console.error("Error toggling assignment:", error);
        return NextResponse.json(
            {
                error: "Failed to update assignment",
                detail: error.message,
                code: error.code
            },
            { status: 500 }
        );
    }
}
