
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, chatGroups } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { projectId, content } = body;

        if (!projectId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find the chat group for this project
        const group = await db.query.chatGroups.findFirst({
            where: eq(chatGroups.projectId, projectId)
        });

        if (!group) {
            return NextResponse.json({ error: "Chat group not found for this project" }, { status: 404 });
        }

        // Create the message
        const [newMessage] = await db.insert(messages).values({
            id: crypto.randomUUID(),
            content,
            senderId: session.user.id,
            groupId: group.id,
            createdAt: sql`NOW()`,
            updatedAt: sql`NOW()`
        }).returning();

        // Emit socket event from server-side using global io instance
        try {
            const io = (global as any).io;
            if (io) {
                console.log(`📤 [API] Broadcasting message to room ${projectId}`);
                io.to(projectId).emit("message", {
                    ...newMessage,
                    projectId: projectId
                });
            }
        } catch (socketError) {
            console.error("Failed to emit socket event:", socketError);
        }

        return NextResponse.json(newMessage);

    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
}
