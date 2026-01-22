import { db } from "@/lib/db";
import { tasks, user, userTaskAssignments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const updateTaskSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    deadline: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    columnId: z.string().optional(),
    type: z.string().optional(),
    assignedUserIds: z.array(z.string()).optional(),
});

export const dynamic = 'force-dynamic';

// GET single task
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

        const [task] = await db.select().from(tasks).where(eq(tasks.id, id));

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
            .where(eq(userTaskAssignments.taskId, id));

        const taskWithAssignees = {
            ...task,
            assignees: assignments.map(a => a.user)
        };

        return NextResponse.json(taskWithAssignees);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
    }
}

// PATCH update task
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validation = updateTaskSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { assignedUserIds, deadline, ...updateData } = validation.data;

        // Check if task exists
        const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, id));
        if (!existingTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Update task
        const updateValues: any = { ...updateData };
        if (deadline !== undefined) {
            updateValues.deadline = deadline ? new Date(deadline) : null;
        }
        updateValues.updatedAt = new Date();

        const [updatedTask] = await db.update(tasks)
            .set(updateValues)
            .where(eq(tasks.id, id))
            .returning();

        // Update assignees if provided
        if (assignedUserIds !== undefined) {
            // Delete existing assignments
            await db.delete(userTaskAssignments).where(eq(userTaskAssignments.taskId, id));

            // Insert new assignments
            if (assignedUserIds.length > 0) {
                await db.insert(userTaskAssignments).values(
                    assignedUserIds.map(userId => ({
                        id: crypto.randomUUID(),
                        userId,
                        taskId: id
                    }))
                );
            }
        }

        // Fetch updated assignees
        const assignments = await db.select({
            user: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
            .from(userTaskAssignments)
            .innerJoin(user, eq(userTaskAssignments.userId, user.id))
            .where(eq(userTaskAssignments.taskId, id));

        return NextResponse.json({
            ...updatedTask,
            assignees: assignments.map(a => a.user)
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

// DELETE task
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check if task exists
        const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, id));
        if (!existingTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Delete task (cascade will delete assignments)
        await db.delete(tasks).where(eq(tasks.id, id));

        return NextResponse.json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
