
import { db } from "@/lib/db";
import { projects, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const project = await db.select({
            id: projects.id,
            name: projects.name,
            status: projects.status,
            totalTime: projects.totalTime,
            completedTime: projects.completedTime,
            updatedAt: projects.updatedAt,
            clientName: clients.name,
        })
        .from(projects)
        .leftJoin(clients, eq(projects.clientId, clients.id))
        .where(eq(projects.id, id))
        .limit(1);

        if (!project.length) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(project[0]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}
