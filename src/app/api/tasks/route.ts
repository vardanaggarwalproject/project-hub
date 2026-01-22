
import { db } from "@/lib/db";
import { tasks, user, userTaskAssignments } from "@/lib/db/schema";
import { eq, and, sql, desc, inArray, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const taskSchema = z.object({
    name: z.string().min(1, "Name required"),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    deadline: z.string().optional(),
    projectId: z.string().min(1, "Project ID required"),
    priority: z.enum(["low", "medium", "high"]).optional(),
    columnId: z.string().optional(),
    type: z.string().optional(),
    assignedUserIds: z.array(z.string()).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const status = searchParams.get("status");
        const columnId = searchParams.get("columnId");
        const priority = searchParams.get("priority");

        let whereClause = undefined;
        const conditions = [];

        if (projectId) conditions.push(eq(tasks.projectId, projectId));
        if (status) conditions.push(eq(tasks.status, status));
        if (columnId) conditions.push(eq(tasks.columnId, columnId));
        if (priority) conditions.push(eq(tasks.priority, priority));

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const taskList = await db.select().from(tasks)
            .where(whereClause)
            .orderBy(asc(tasks.position), desc(tasks.createdAt));

        // Fetch assignments for these tasks
        const taskIds = taskList.map(t => t.id);
        const allAssignments = taskIds.length > 0
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
                .where(inArray(userTaskAssignments.taskId, taskIds))
            : [];

        const tasksWithAssignees = taskList.map(task => ({
            ...task,
            assignees: allAssignments
                .filter(a => a.taskId === task.id)
                .map(a => a.user)
        }));

        return NextResponse.json(tasksWithAssignees);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = taskSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { name, description, status, deadline, projectId, priority, columnId, type, assignedUserIds } = validation.data;

        // Calculate position - append to end of column
        let position = 0;
        if (columnId) {
            const existingTasks = await db.select().from(tasks)
                .where(eq(tasks.columnId, columnId));
            position = existingTasks.length;
        }

        const [newTask] = await db.insert(tasks).values({
            id: crypto.randomUUID(),
            name,
            description,
            status: status || "todo",
            deadline: deadline ? new Date(deadline) : null,
            projectId,
            priority: priority || "medium",
            columnId: columnId || null,
            position,
            type: type || null,
        }).returning();

        if (assignedUserIds && assignedUserIds.length > 0) {
            await db.insert(userTaskAssignments).values(
                assignedUserIds.map(userId => ({
                    id: crypto.randomUUID(),
                    userId,
                    taskId: newTask.id
                }))
            );
        }

        // Fetch assignees for the new task
        const assignees = assignedUserIds && assignedUserIds.length > 0
            ? await db.select({
                id: user.id,
                name: user.name,
                image: user.image
            })
                .from(user)
                .where(inArray(user.id, assignedUserIds))
            : [];

        return NextResponse.json({ ...newTask, assignees }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
