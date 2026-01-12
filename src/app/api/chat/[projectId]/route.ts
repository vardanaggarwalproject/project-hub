
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, chatGroups, user, userProjectAssignments } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, asc, and, sql } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;
        if (!projectId) return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });


        // Find group
        const group = await db.select().from(chatGroups).where(eq(chatGroups.projectId, projectId)).limit(1);

        if (!group || group.length === 0) {
            return NextResponse.json([]); // Return empty list to avoid crashes
        }

        const groupId = group[0].id;

        // Fetch messages
        const results = await db.select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            senderName: user.name,
            senderImage: user.image,
            createdAt: messages.createdAt
        })
            .from(messages)
            .leftJoin(user, eq(messages.senderId, user.id))
            .where(eq(messages.groupId, groupId))
            .orderBy(asc(messages.createdAt));

        // Add projectId to each message (frontend expects it)
        const messagesWithProject = results.map(m => ({
            ...m,
            projectId: projectId
        }));

        return NextResponse.json(messagesWithProject);

    } catch (error: any) {
        console.error("Critical error in /api/chat/[projectId]:", error);
        return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
    }
}
