
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const clientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().or(z.literal('')),
    description: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const allClients = await db.select().from(clients);
        return NextResponse.json(allClients);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = clientSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors }, { status: 400 });
        }

        const { name, email, description } = validation.data;
        
        const newClient = await db.insert(clients).values({
            id: crypto.randomUUID(),
            name,
            email: email || undefined,
            description,
        }).returning();

        return NextResponse.json(newClient[0], { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}
