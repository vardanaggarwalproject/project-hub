import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { sql, desc, ilike, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const clientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().or(z.literal('')),
    description: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search");

        const offset = (page - 1) * limit;

        let whereClause = undefined;
        if (search) {
            whereClause = ilike(clients.name, `%${search}%`);
        }

        const clientList = await db.select()
            .from(clients)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(clients.updatedAt));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(clients)
            .where(whereClause);
        
        const total = totalResult[0].count;

        return NextResponse.json({
            data: clientList,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = clientSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
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
        console.error(error);
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}
