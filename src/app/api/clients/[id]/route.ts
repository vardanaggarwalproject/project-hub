
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const clientUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    description: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const client = await db.select().from(clients).where(eq(clients.id, id));
        
        if (client.length === 0) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json(client[0]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await req.json();
        const validation = clientUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors }, { status: 400 });
        }

        const updatedClient = await db.update(clients)
            .set({ ...validation.data, updatedAt: new Date() })
            .where(eq(clients.id, id))
            .returning();

        if (updatedClient.length === 0) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json(updatedClient[0]);
    } catch (error) {
         return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const deleted = await db.delete(clients).where(eq(clients.id, id)).returning();
        
        if (deleted.length === 0) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
    }
}
