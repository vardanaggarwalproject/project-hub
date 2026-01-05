
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

        return NextResponse.json(client[0]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
    }
}
