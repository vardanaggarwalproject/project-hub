
import { db } from "@/lib/db";
import { chatGroups, projects, userProjectAssignments } from "@/lib/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
    try {
        // Get the current user session
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRole = session.user.role;

        // If admin, show all groups; otherwise filter by assignments
        let groups;
        
        if (userRole === "admin") {
            groups = await db.select({
                id: chatGroups.id,
                name: chatGroups.name,
                projectId: chatGroups.projectId,
                projectName: projects.name,
                developerCount: sql<number>`count(DISTINCT ${userProjectAssignments.userId})`.mapWith(Number),
            })
            .from(chatGroups)
            .leftJoin(projects, eq(chatGroups.projectId, projects.id))
            .leftJoin(userProjectAssignments, eq(chatGroups.projectId, userProjectAssignments.projectId))
            .groupBy(chatGroups.id, chatGroups.name, chatGroups.projectId, projects.name);
        } else {
            // Get projects assigned to this user
            const userProjects = await db.select({ projectId: userProjectAssignments.projectId })
                .from(userProjectAssignments)
                .where(eq(userProjectAssignments.userId, userId));

            const projectIds = userProjects.map(p => p.projectId);

            if (projectIds.length === 0) {
                return NextResponse.json([]);
            }

            groups = await db.select({
                id: chatGroups.id,
                name: chatGroups.name,
                projectId: chatGroups.projectId,
                projectName: projects.name,
                developerCount: sql<number>`count(DISTINCT ${userProjectAssignments.userId})`.mapWith(Number),
            })
            .from(chatGroups)
            .leftJoin(projects, eq(chatGroups.projectId, projects.id))
            .leftJoin(userProjectAssignments, eq(chatGroups.projectId, userProjectAssignments.projectId))
            .where(inArray(chatGroups.projectId, projectIds))
            .groupBy(chatGroups.id, chatGroups.name, chatGroups.projectId, projects.name);
        }
        
        return NextResponse.json(groups);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch chat groups" }, { status: 500 });
    }
}
