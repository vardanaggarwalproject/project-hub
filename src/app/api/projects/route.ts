import { db } from "@/lib/db";
import { projects, clients, chatGroups } from "@/lib/db/schema";
import { eq, and, sql, desc, ilike } from "drizzle-orm";
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
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const clientId = searchParams.get("clientId");
        const search = searchParams.get("search");

        const offset = (page - 1) * limit;

        let whereClause = undefined;
        const conditions = [];

        if (status) conditions.push(eq(projects.status, status));
        if (clientId) conditions.push(eq(projects.clientId, clientId));
        // Note: ILike is pg specific, using sql for generic search if needed or simple like
        if (search) conditions.push(sql`${projects.name} ILIKE ${`%${search}%`}`);

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const projectList = await db.select({
            id: projects.id,
            name: projects.name,
            status: projects.status,
            clientName: clients.name,
            updatedAt: projects.updatedAt,
        })
        .from(projects)
        .leftJoin(clients, eq(projects.clientId, clients.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(projects.updatedAt));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(projects)
            .where(whereClause);
        
        const total = totalResult[0].count;

        return NextResponse.json({
            data: projectList,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = projectSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { name, clientId, status, totalTime } = validation.data;
        
        const [newProject] = await db.insert(projects).values({
            id: crypto.randomUUID(),
            name,
            clientId,
            status: status || "active",
            totalTime,
        }).returning();

        // Create a chat group for the new project
        await db.insert(chatGroups).values({
            id: crypto.randomUUID(),
            name: `${name} Chat`,
            projectId: newProject.id,
        });

        return NextResponse.json(newProject, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
