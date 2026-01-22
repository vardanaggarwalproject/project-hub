import { db } from "@/lib/db";
import { taskColumns } from "@/lib/db/schema";
import { eq, or, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const columnSchema = z.object({
    title: z.string().min(1, "Title required"),
    color: z.string().default("#6B7280"),
    projectId: z.string().optional(),
    userId: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = session.user.id;
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        let whereClause;

        if (projectId) {
            // PROJECT-LEVEL VISIBILITY RULE:
            // Show columns that are:
            // 1. Project-level (everyone in this project sees them)
            // 2. User's personal columns (only this user sees them)
            // 3. Default columns (everyone sees them)
            whereClause = or(
                eq(taskColumns.projectId, projectId),  // Project-level: ALL team members see
                eq(taskColumns.userId, currentUserId),  // Personal: Only this user sees
                eq(taskColumns.isDefault, true)         // Default: Everyone sees
            );
        } else {
            // No project selected: Show only personal + default columns
            whereClause = or(
                eq(taskColumns.userId, currentUserId),  // Personal columns
                eq(taskColumns.isDefault, true)         // Default columns
            );
        }

        const columns = await db.select().from(taskColumns)
            .where(whereClause)
            .orderBy(asc(taskColumns.position), asc(taskColumns.createdAt));

        return NextResponse.json(columns);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = columnSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { title, color, projectId, userId } = validation.data;
        const currentUserId = session.user.id;

        // Calculate position - append to end of ALL visible columns (default + project + user)
        let whereClause;
        if (projectId) {
            whereClause = or(
                eq(taskColumns.projectId, projectId),
                eq(taskColumns.userId, currentUserId),
                eq(taskColumns.isDefault, true)
            );
        } else {
            whereClause = or(
                eq(taskColumns.userId, currentUserId),
                eq(taskColumns.isDefault, true)
            );
        }

        const existingColumns = await db.select().from(taskColumns)
            .where(whereClause);

        const position = existingColumns.length;

        const [newColumn] = await db.insert(taskColumns).values({
            id: crypto.randomUUID(),
            title,
            color,
            position,
            projectId: projectId || null,
            userId: userId || null,
            isDefault: false,
        }).returning();

        return NextResponse.json(newColumn, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
    }
}
