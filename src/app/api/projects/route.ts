
import { db } from "@/lib/db";
import { projects, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const projectSchema = z.object({
    name: z.string().min(1, "Name is required"),
    clientId: z.string().min(1, "Client ID is required"),
    status: z.enum(["active", "completed", "on-hold"]).optional(),
    totalTime: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const allProjects = await db.select({
            id: projects.id,
            name: projects.name,
            status: projects.status,
            clientName: clients.name,
            updatedAt: projects.updatedAt,
        })
        .from(projects)
        .leftJoin(clients, eq(projects.clientId, clients.id));
        
        return NextResponse.json(allProjects);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = projectSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors }, { status: 400 });
        }

        const { name, clientId, status, totalTime } = validation.data;
        
        const newProject = await db.insert(projects).values({
            id: crypto.randomUUID(),
            name,
            clientId,
            status: status || "active",
            totalTime,
        }).returning();

        return NextResponse.json(newProject[0], { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
