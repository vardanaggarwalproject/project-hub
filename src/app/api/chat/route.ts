
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
            groupId: group.id
        }).returning();

        // Emit socket event from server-side using global io instance
        try {
            const io = (global as any).io;

            if (!io) {
                return NextResponse.json(newMessage);
            }


            const groupRoom = `group:${projectId}`;

            // Prepare the complete message payload with sender info
            const messagePayload = {
                id: newMessage.id,
                content: newMessage.content,
                senderId: newMessage.senderId,
                groupId: newMessage.groupId,
                createdAt: newMessage.createdAt,
                projectId: projectId,
                senderName: session.user.name || "Unknown User"
            };


            // 1. Broadcast to the active group room (for those currently in chat)
            io.to(groupRoom).emit("message", messagePayload);

            // Check how many sockets are in the room

            // 2. Broadcast to individual user rooms for unread counts / notifications
            // Fetch all members of this project
            const { userProjectAssignments } = await import("@/lib/db/schema");
            const assignments = await db.query.userProjectAssignments.findMany({
                where: eq(userProjectAssignments.projectId, projectId),
                columns: {
                    userId: true
                }
            });


            // Send to each user's private inbox
            let sentCount = 0;
            assignments.forEach(assign => {
                const userRoom = `user:${assign.userId}`;

                if (assign.userId !== session.user.id) {
                    io.to(userRoom).emit("message", messagePayload);
                    sentCount++;
                } else {
                }
            });


        } catch (socketError) {
        }

        return NextResponse.json(newMessage);

    } catch (error) {
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
}
