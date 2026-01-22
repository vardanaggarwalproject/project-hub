import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const reorderSchema = z.object({
    taskId: z.string().min(1, "Task ID required"),
    sourceColumnId: z.string().nullable(),
    destinationColumnId: z.string(),
    position: z.number().int().min(0),
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = reorderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { taskId, sourceColumnId, destinationColumnId, position } = validation.data;

        // Get the task being moved
        const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const oldPosition = task.position || 0;
        const oldColumnId = task.columnId;

        // Moving within the same column
        if (sourceColumnId === destinationColumnId) {
            if (oldPosition === position) {
                return NextResponse.json({ success: true, message: "No change needed" });
            }

            // Update positions of tasks in the same column
            if (oldPosition < position) {
                // Moving down: decrement positions between old and new
                await db.update(tasks)
                    .set({ position: sql`${tasks.position} - 1` })
                    .where(
                        and(
                            eq(tasks.columnId, destinationColumnId),
                            gte(tasks.position, oldPosition + 1),
                            lte(tasks.position, position)
                        )
                    );
            } else {
                // Moving up: increment positions between new and old
                await db.update(tasks)
                    .set({ position: sql`${tasks.position} + 1` })
                    .where(
                        and(
                            eq(tasks.columnId, destinationColumnId),
                            gte(tasks.position, position),
                            lte(tasks.position, oldPosition - 1)
                        )
                    );
            }

            // Update the moved task
            await db.update(tasks)
                .set({ position, updatedAt: new Date() })
                .where(eq(tasks.id, taskId));

        } else {
            // Moving to a different column

            // Decrement positions in source column (for tasks after the moved task)
            if (sourceColumnId) {
                await db.update(tasks)
                    .set({ position: sql`${tasks.position} - 1` })
                    .where(
                        and(
                            eq(tasks.columnId, sourceColumnId),
                            gte(tasks.position, oldPosition + 1)
                        )
                    );
            }

            // Increment positions in destination column (for tasks at or after new position)
            await db.update(tasks)
                .set({ position: sql`${tasks.position} + 1` })
                .where(
                    and(
                        eq(tasks.columnId, destinationColumnId),
                        gte(tasks.position, position)
                    )
                );

            // Update the moved task with new column and position
            await db.update(tasks)
                .set({
                    columnId: destinationColumnId,
                    position,
                    updatedAt: new Date()
                })
                .where(eq(tasks.id, taskId));
        }

        return NextResponse.json({
            success: true,
            message: "Task reordered successfully"
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to reorder task" }, { status: 500 });
    }
}
