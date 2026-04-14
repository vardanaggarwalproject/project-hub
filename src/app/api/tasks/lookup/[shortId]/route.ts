import { db } from "@/lib/db";
import { tasks, user, userTaskAssignments } from "@/lib/db/schema";
import { sql, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

// GET task by short ID (first 8 characters)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ shortId: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { shortId } = await params;

        // Find task by shortId (exact match)
        const [task] = await db.select()
            .from(tasks)
            .where(eq(tasks.shortId, shortId))
            .limit(1);

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Fetch assignees
        const assignments = await db.select({
            user: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
            .from(userTaskAssignments)
            .innerJoin(user, eq(userTaskAssignments.userId, user.id))
            .where(eq(userTaskAssignments.taskId, task.id));

        // Fetch subtasks
        const subtasksList = await db.select().from(tasks)
            .where(eq(tasks.parentTaskId, task.id));

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

        const taskWithAssignees = {
            ...task,
            assignees: assignments.map(a => a.user),
            subtasks: subtasksWithAssignees
        };

        return NextResponse.json(taskWithAssignees);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
    }
}
