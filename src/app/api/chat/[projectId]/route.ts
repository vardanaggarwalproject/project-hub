
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, chatGroups, user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
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

        // Find the chat group
        const group = await db.query.chatGroups.findFirst({
            where: eq(chatGroups.projectId, projectId)
        });

        if (!group) {
             // Return empty array instead of 404 if no group exists yet (could happen)? 
             // Or better, 404 implies "not found". 
             // But chat-window expects array.
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Fetch messages with sender info
        // Using db.query.messages.findMany with relational query would be nicer if relations were set up in schema.ts
        // Since schema.ts (as seen in prev turn) just has table definitions but maybe missing explicit `relations`,
        // let's do a join manually or use findMany if we assume relations exist in `index.ts`.
        // I'll stick to manual join logic via `db.select` or relying on what's available. 
        // Let's assume `db.query` works if relations are defined (usually `index.ts` is where DRIZZLE relations are).
        // If not, I'll fallback to `db.select`.
        // Reviewing schema.ts from previous turn... it only exported tables.
        // It's safer to use `db.select` with `leftJoin` or just fetch and map if simpler.
        // Actually, let's try `db.select().from(messages).innerJoin(user, ...)` pattern.

        const results = await db.select({
            id: messages.id,
            projectId: chatGroups.projectId, // Derived from join, but we know it
            senderId: messages.senderId,
            senderName: user.name,
            content: messages.content,
            createdAt: messages.createdAt
        })
        .from(messages)
        .innerJoin(chatGroups, eq(messages.groupId, chatGroups.id))
        .innerJoin(user, eq(messages.senderId, user.id))
        .where(eq(chatGroups.projectId, projectId))
        .orderBy(asc(messages.createdAt));

        return NextResponse.json(results);

    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}
