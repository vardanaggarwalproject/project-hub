
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_ROLES = ["admin", "developer", "tester", "designer"] as const;

const roleSchema = z.object({
    name: z.enum(ALLOWED_ROLES, {
        message: `Role must be one of: ${ALLOWED_ROLES.join(", ")}`
    }),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const role = await db.select().from(roles).where(eq(roles.id, id));

        if (role.length === 0) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        return NextResponse.json(role[0]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await req.json();
        const validation = roleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { name } = validation.data;

        // Check if role name taken by another role
        const existing = await db.select().from(roles).where(eq(roles.name, name));
        if (existing.length > 0 && existing[0].id !== id) {
            return NextResponse.json({ error: "Role name already exists" }, { status: 409 });
        }

        const updatedRole = await db.update(roles)
            .set({ name, updatedAt: new Date().toISOString() })
            .where(eq(roles.id, id))
            .returning();

        if (updatedRole.length === 0) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        return NextResponse.json(updatedRole[0]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const deleted = await db.delete(roles).where(eq(roles.id, id)).returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
    }
}
