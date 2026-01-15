import { db } from "@/lib/db";
import { clients, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const clientUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    description: z.string().optional(),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const client = await db.select().from(clients).where(eq(clients.id, id)).limit(1);

        if (!client.length) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Fetch all projects for this client
        const clientProjects = await db.select().from(projects).where(eq(projects.clientId, id));

        return NextResponse.json({
            ...client[0],
            projects: clientProjects
        });
    } catch (error) {
        console.error("Error fetching client:", error);
        return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validation = clientUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { name, email, address, description } = validation.data;

        // Build update object with only provided fields
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email || null;
        if (address !== undefined) updateData.address = address || null;
        if (description !== undefined) updateData.description = description || null;

        const updatedClient = await db
            .update(clients)
            .set(updateData)
            .where(eq(clients.id, id))
            .returning();

        if (!updatedClient.length) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json(updatedClient[0]);
    } catch (error) {
        console.error("Error updating client:", error);
        return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if client exists
        const client = await db.select().from(clients).where(eq(clients.id, id)).limit(1);

        if (!client.length) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Delete the client (cascades will delete associated projects)
        await db.delete(clients).where(eq(clients.id, id));

        return NextResponse.json({ message: "Client deleted successfully" });
    } catch (error) {
        console.error("Error deleting client:", error);
        return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
    }
}
