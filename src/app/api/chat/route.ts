
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

            if (!io) {
                console.error("❌ [API] Socket.IO instance not found on global object!");
                return NextResponse.json(newMessage);
            }

            console.log("✅ [API] Socket.IO instance found");

            const groupRoom = `group:${projectId}`;
            console.log(`📤 [API] Preparing to broadcast message to ${groupRoom}`);

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

            console.log(`📦 [API] Message payload:`, JSON.stringify(messagePayload, null, 2));

            // 1. Broadcast to the active group room (for those currently in chat)
            const groupEmitResult = io.to(groupRoom).emit("message", messagePayload);
            console.log(`✅ [API] Emitted to group room: ${groupRoom}`, groupEmitResult);

            // Check how many sockets are in the room
            io.in(groupRoom).fetchSockets().then((sockets: any[]) => {
                console.log(`👥 [API] Sockets in ${groupRoom}: ${sockets.length}`);
                sockets.forEach((s: any) => {
                    console.log(`  - Socket ${s.id} in rooms:`, Array.from(s.rooms));
                });
            });

            // 2. Broadcast to individual user rooms for unread counts / notifications
            // Fetch all members of this project
            const { userProjectAssignments } = await import("@/lib/db/schema");
            const assignments = await db.query.userProjectAssignments.findMany({
                where: eq(userProjectAssignments.projectId, projectId),
                columns: {
                    userId: true
                }
            });

            console.log(`📋 [API] Found ${assignments.length} project members for project ${projectId}`);
            console.log(`📋 [API] User IDs:`, assignments.map(a => a.userId));

            // Send to each user's private inbox
            let sentCount = 0;
            assignments.forEach(assign => {
                const userRoom = `user:${assign.userId}`;
                console.log(`📨 [API] Checking user ${assign.userId}: isSender=${assign.userId === session.user.id}`);

                if (assign.userId !== session.user.id) {
                    io.to(userRoom).emit("message", messagePayload);
                    console.log(`✅ [API] Sent message to ${userRoom}`);
                    sentCount++;
                } else {
                    console.log(`⏭️ [API] Skipping sender ${userRoom}`);
                }
            });

            console.log(`✅ [API] Sent to ${sentCount} user rooms out of ${assignments.length} total members`);

        } catch (socketError) {
            console.error("❌ [API] Failed to emit socket event:", socketError);
            console.error("Stack trace:", (socketError as Error).stack);
        }

        return NextResponse.json(newMessage);

    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
}
