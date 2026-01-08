
import { db } from "@/lib/db";
import { messages, user, chatGroups, userProjectAssignments } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        // Get session to verify access
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user has access to this project (unless admin)
        if (session.user.role !== "admin") {
            const assignment = await db.select()
                .from(userProjectAssignments)
                .where(and(
                    eq(userProjectAssignments.projectId, projectId),
                    eq(userProjectAssignments.userId, session.user.id)
                ))
                .limit(1);

            if (assignment.length === 0) {
                return NextResponse.json({ error: "Access denied to this project" }, { status: 403 });
            }
        }

        // Find the group for this project
        const group = await db.select().from(chatGroups).where(eq(chatGroups.projectId, projectId)).limit(1);

        if (!group.length) {
            return NextResponse.json({ error: "Chat group not found" }, { status: 404 });
        }

        const msgs = await db.select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            senderName: user.name,
            senderImage: user.image,
            createdAt: messages.createdAt,
        })
            .from(messages)
            .innerJoin(user, eq(messages.senderId, user.id))
            .where(eq(messages.groupId, group[0].id))
            .orderBy(messages.createdAt);

        return NextResponse.json(msgs);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await req.json();
        const { content, senderId } = body;

        // Get session to verify sender
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Ensure senderId matches session user
        if (session.user.id !== senderId) {
            return NextResponse.json({ error: "Sender ID mismatch" }, { status: 403 });
        }

        // Verify user is assigned to this project (unless admin)
        if (session.user.role !== "admin") {
            const assignment = await db.select()
                .from(userProjectAssignments)
                .where(and(
                    eq(userProjectAssignments.projectId, projectId),
                    eq(userProjectAssignments.userId, senderId)
                ))
                .limit(1);

            if (assignment.length === 0) {
                return NextResponse.json({ error: "You are not assigned to this project" }, { status: 403 });
            }
        }

        // Find group ID for this project
        const group = await db.select().from(chatGroups).where(eq(chatGroups.projectId, projectId)).limit(1);

        if (!group.length) {
            return NextResponse.json({ error: "Chat group not found" }, { status: 404 });
        }

        const newMessage = await db.insert(messages).values({
            id: crypto.randomUUID(),
            content,
            senderId,
            groupId: group[0].id,
            createdAt: sql`NOW()`,
        }).returning();

        return NextResponse.json(newMessage[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
}
