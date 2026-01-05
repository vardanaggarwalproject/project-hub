
import { db } from "@/lib/db";
import { chatGroups, projects, userProjectAssignments } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const groups = await db.select({
            id: chatGroups.id,
            name: chatGroups.name,
            projectId: chatGroups.projectId,
            developerCount: sql<number>`count(${userProjectAssignments.userId})`.mapWith(Number),
        })
        .from(chatGroups)
        .leftJoin(userProjectAssignments, eq(chatGroups.projectId, userProjectAssignments.projectId))
        .groupBy(chatGroups.id, chatGroups.name, chatGroups.projectId);
        
        return NextResponse.json(groups);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch chat groups" }, { status: 500 });
    }
}
