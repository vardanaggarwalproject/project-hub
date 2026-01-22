import { db } from "@/lib/db";
import { taskColumns, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const updateColumnSchema = z.object({
    title: z.string().min(1).optional(),
    color: z.string().optional(),
    position: z.number().int().min(0).optional(),
});

export const dynamic = 'force-dynamic';

// PATCH update column
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
        const validation = updateColumnSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        // Check if column exists
        const [existingColumn] = await db.select().from(taskColumns).where(eq(taskColumns.id, id));
        if (!existingColumn) {
            return NextResponse.json({ error: "Column not found" }, { status: 404 });
        }

        // Prevent updating default columns
        if (existingColumn.isDefault) {
            return NextResponse.json({ error: "Cannot modify default columns" }, { status: 403 });
        }

        const [updatedColumn] = await db.update(taskColumns)
            .set({
                ...validation.data,
                updatedAt: new Date()
            })
            .where(eq(taskColumns.id, id))
            .returning();

        return NextResponse.json(updatedColumn);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update column" }, { status: 500 });
    }
}

// DELETE column
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

        // Check if column exists
        const [existingColumn] = await db.select().from(taskColumns).where(eq(taskColumns.id, id));
        if (!existingColumn) {
            return NextResponse.json({ error: "Column not found" }, { status: 404 });
        }

        // Prevent deleting default columns
        if (existingColumn.isDefault) {
            return NextResponse.json({ error: "Cannot delete default columns" }, { status: 403 });
        }

        // Delete column (tasks will have columnId set to NULL due to ON DELETE SET NULL)
        await db.delete(taskColumns).where(eq(taskColumns.id, id));

        return NextResponse.json({ success: true, message: "Column deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
    }
}
