
import { db } from "@/lib/db";
import { messages, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        
        // Find the group for this project
        // Note: For simplicity, we assume one group per project
        const msgs = await db.select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            senderName: user.name,
            createdAt: messages.createdAt,
        })
        .from(messages)
        .innerJoin(user, eq(messages.senderId, user.id))
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

        // Find group ID for this project (omitted for brevity, should look up chatGroups.id where projectId = projectId)
        // For now, we'll assume a direct one-to-one mapping if needed or just use a fixed group for testing
        // Let's actually look it up
        const { chatGroups } = await import("@/lib/db/schema");
        const group = await db.select().from(chatGroups).where(eq(chatGroups.projectId, projectId)).limit(1);
        
        if (!group.length) {
            return NextResponse.json({ error: "Chat group not found" }, { status: 404 });
        }

        const newMessage = await db.insert(messages).values({
            id: crypto.randomUUID(),
            content,
            senderId,
            groupId: group[0].id,
            createdAt: new Date(),
        }).returning();

        return NextResponse.json(newMessage[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
}
