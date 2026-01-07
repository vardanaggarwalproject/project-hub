import { db } from "@/lib/db";
import { projects, clients, chatGroups, user, userProjectAssignments } from "@/lib/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const projectSchema = z.object({
    name: z.string().min(1, "Name required"),
    clientId: z.string().min(1, "Client ID required"),
    status: z.enum(["active", "completed", "on-hold"]).optional(),
    totalTime: z.string().optional(),
    description: z.string().optional(),
    assignedUserIds: z.array(z.string()).optional(),
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
            totalTime: projects.totalTime,
            completedTime: projects.completedTime,
            description: projects.description,
            updatedAt: projects.updatedAt,
        })
            .from(projects)
            .leftJoin(clients, eq(projects.clientId, clients.id))
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(projects.updatedAt));

        // Fetch assignments for these projects
        const projectIds = projectList.map(p => p.id);
        const allAssignments = projectIds.length > 0
            ? await db.select({
                projectId: userProjectAssignments.projectId,
                user: {
                    id: user.id,
                    name: user.name,
                    image: user.image,
                    role: user.role
                }
            })
                .from(userProjectAssignments)
                .innerJoin(user, eq(userProjectAssignments.userId, user.id))
                .where(inArray(userProjectAssignments.projectId, projectIds))
            : [];

        const projectsWithTeam = projectList.map(project => ({
            ...project,
            team: allAssignments
                .filter(a => a.projectId === project.id)
                .map(a => a.user)
        }));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(projects)
            .where(whereClause);

        const total = Number(totalResult[0]?.count || 0);

        return NextResponse.json({
            data: projectsWithTeam,
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

        const { name, clientId, status, totalTime, description, assignedUserIds } = validation.data;

        const [newProject] = await db.insert(projects).values({
            id: crypto.randomUUID(),
            name,
            clientId,
            status: status || "active",
            totalTime: totalTime || null,
            completedTime: null, // explicit null
            description: description || null, // explicit null
        }).returning();

        // Handle assignments
        if (assignedUserIds && assignedUserIds.length > 0) {
            await db.insert(userProjectAssignments).values(
                assignedUserIds.map(userId => ({
                    id: crypto.randomUUID(),
                    userId,
                    projectId: newProject.id
                }))
            );
        }

        // Create a chat group for the new project
        await db.insert(chatGroups).values({
            id: crypto.randomUUID(),
            name: `${name} Chat`,
            projectId: newProject.id,
        });

        return NextResponse.json(newProject, { status: 201 });

    } catch (error: any) {
        console.error("Project creation error:", error);
        return NextResponse.json({
            error: "Failed to create project",
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            constraint: error.constraint,
            stack: error.stack
        }, { status: 500 });
    }
}
