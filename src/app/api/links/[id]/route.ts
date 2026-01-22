import { db } from "@/lib/db";
import { links, userProjectAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const updateLinkSchema = z.object({
    title: z.string().min(1).optional(),
    url: z.string().url().optional(),
    category: z.string().optional(),
    allowedRoles: z.array(z.string()).optional(),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = updateLinkSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const data = validation.data;
        const userId = session.user.id;
        const userRole = session.user.role;

        // Fetch link to find its project
        const link = await db.select()
            .from(links)
            .where(eq(links.id, id))
            .limit(1);

        if (link.length === 0) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 });
        }

        const projectId = link[0].projectId;

        // Authorization check: Admin OR Project Member
        if (userRole !== "admin") {
            const assignment = await db.select()
                .from(userProjectAssignments)
                .where(
                    and(
                        eq(userProjectAssignments.projectId, projectId),
                        eq(userProjectAssignments.userId, userId)
                    )
                )
                .limit(1);

            if (assignment.length === 0) {
                return NextResponse.json({ error: "Unauthorized: You are not assigned to this project" }, { status: 403 });
            }
        }

        const updateData: any = {};
        if (data.title) updateData.name = data.title;
        if (data.url) updateData.url = data.url;
        if (data.category !== undefined) updateData.description = data.category;
        if (data.allowedRoles) updateData.allowedRoles = data.allowedRoles;
        updateData.updatedAt = new Date();

        const [updatedLink] = await db.update(links)
            .set(updateData)
            .where(eq(links.id, id))
            .returning();

        return NextResponse.json(updatedLink);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRole = session.user.role;

        // Fetch link to find its project
        const link = await db.select()
            .from(links)
            .where(eq(links.id, id))
            .limit(1);

        if (link.length === 0) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 });
        }

        const projectId = link[0].projectId;

        // Authorization check: Admin OR Project Member
        if (userRole !== "admin") {
            const assignment = await db.select()
                .from(userProjectAssignments)
                .where(
                    and(
                        eq(userProjectAssignments.projectId, projectId),
                        eq(userProjectAssignments.userId, userId)
                    )
                )
                .limit(1);

            if (assignment.length === 0) {
                return NextResponse.json({ error: "Unauthorized: You are not assigned to this project" }, { status: 403 });
            }
        }

        await db.delete(links).where(eq(links.id, id));

        return NextResponse.json({ message: "Link deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
    }
}
