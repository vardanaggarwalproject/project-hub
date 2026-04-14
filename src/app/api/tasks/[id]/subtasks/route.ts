import { db } from "@/lib/db";
import { tasks, user, userTaskAssignments } from "@/lib/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

// GET subtasks for a task
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify parent task exists
        const [parentTask] = await db.select().from(tasks).where(eq(tasks.id, id));
        if (!parentTask) {
            return NextResponse.json({ error: "Parent task not found" }, { status: 404 });
        }

        // Fetch subtasks
        const subtasksList = await db.select().from(tasks)
            .where(eq(tasks.parentTaskId, id))
            .orderBy(asc(tasks.position), asc(tasks.createdAt));

        // Fetch assignees for subtasks
        const subtaskIds = subtasksList.map(st => st.id);
        const subtaskAssignments = subtaskIds.length > 0
            ? await db.select({
                taskId: userTaskAssignments.taskId,
                user: {
                    id: user.id,
                    name: user.name,
                    image: user.image
                }
            })
                .from(userTaskAssignments)
                .innerJoin(user, eq(userTaskAssignments.userId, user.id))
                .where(inArray(userTaskAssignments.taskId, subtaskIds))
            : [];

        const subtasksWithAssignees = subtasksList.map(subtask => ({
            ...subtask,
            assignees: subtaskAssignments
                .filter(a => a.taskId === subtask.id)
                .map(a => a.user)
        }));

        return NextResponse.json(subtasksWithAssignees);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch subtasks" }, { status: 500 });
    }
}
