
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth"; // We need to verify if user is admin usually

const ALLOWED_ROLES = ["admin", "developer", "tester", "designer"] as const;

const roleSchema = z.object({
    name: z.enum(ALLOWED_ROLES, {
        message: `Role must be one of: ${ALLOWED_ROLES.join(", ")}`
    }),
});

export async function GET(req: Request) {
    try {
        // TODO: Add auth check (admin only)
        const allRoles = await db.select().from(roles);
        return NextResponse.json(allRoles);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // TODO: Add auth check (admin only)
        const body = await req.json();
        const validation = roleSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { name } = validation.data;
        
        // Check if role exists
        const existing = await db.select().from(roles).where(eq(roles.name, name));
        if (existing.length > 0) {
            return NextResponse.json({ error: "Role already exists" }, { status: 409 });
        }

        const newRole = await db.insert(roles).values({
            id: crypto.randomUUID(),
            name,
        }).returning();

        return NextResponse.json(newRole[0], { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }
}
