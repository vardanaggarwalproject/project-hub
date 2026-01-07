
import { db } from "@/lib/db";
import { userProjectAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;
        const userId = session.user.id;
        const now = new Date().toISOString();

        // 1. Check if assignment exists
        const existing = await db.select()
            .from(userProjectAssignments)
            .where(and(
                eq(userProjectAssignments.userId, userId),
                eq(userProjectAssignments.projectId, projectId)
            ))
            .limit(1);

        if (existing.length > 0) {
            // 2. Update existing
            await db.update(userProjectAssignments)
                .set({
                    lastReadAt: now,
                    updatedAt: now
                })
                .where(eq(userProjectAssignments.id, existing[0].id));

            return NextResponse.json({ success: true, action: "updated" });
        } else if (session.user.role === "admin") {
            // 3. Create for admin if missing
            await db.insert(userProjectAssignments).values({
                id: crypto.randomUUID(),
                userId: userId,
                projectId: projectId,
                lastReadAt: now,
                updatedAt: now,
                assignedAt: now,
                createdAt: now
            });
            return NextResponse.json({ success: true, action: "created" });
        }

        return NextResponse.json({ success: true, action: "none", message: "No assignment found and not an admin" });
    } catch (error: any) {
        console.error("Error marking as read (v2):", error);
        return NextResponse.json({
            error: "Failed to mark as read",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
