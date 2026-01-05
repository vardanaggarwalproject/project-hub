
import { db } from "@/lib/db";
import { user, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    role: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const fetchedUser = await db.select().from(user).where(eq(user.id, id));
        
        if (fetchedUser.length === 0) {
             return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(fetchedUser[0]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await req.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors }, { status: 400 });
        }

        const { name, role } = validation.data;
        const updateData: any = { updatedAt: new Date() };
        if (name) updateData.name = name;
        
        if (role) {
            const roleExists = await db.select().from(roles).where(eq(roles.name, role));
            if (roleExists.length === 0) {
                return NextResponse.json({ error: "Invalid role" }, { status: 400 });
            }
            updateData.role = role;
        }

        const updatedUser = await db.update(user)
            .set(updateData)
            .where(eq(user.id, id))
            .returning();

        if (updatedUser.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
         return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const deleted = await db.delete(user).where(eq(user.id, id)).returning();
        
        if (deleted.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
