import { db } from "@/lib/db";
import { projects, clients, chatGroups, user, userProjectAssignments, links } from "@/lib/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const projectSchema = z.object({
    name: z.string().min(1, "Name required"),
    clientId: z.string().min(1, "Client ID required"),
    status: z.enum(["active", "completed", "on-hold"]).optional(),
    totalTime: z.string().optional(),
    description: z.string().optional(),
    assignedUserIds: z.array(z.string()).optional(),
    links: z.array(z.object({
        label: z.string(),
        value: z.string(),
        allowedRoles: z.array(z.string()).optional().default(["admin", "developer", "tester"]),
    })).optional(),
    isMemoRequired: z.boolean().optional(),
});



export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        const userRole = session?.user?.role;
        const currentUserId = session?.user?.id;

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const clientId = searchParams.get("clientId");
        const search = searchParams.get("search");
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");

        const offset = (page - 1) * limit;

        let whereClause = undefined;
        const conditions = [];

        if (status) conditions.push(eq(projects.status, status));
        if (clientId) conditions.push(eq(projects.clientId, clientId));
        // Note: ILike is pg specific, using sql for generic search if needed or simple like
        if (search) conditions.push(sql`${projects.name} ILIKE ${`%${search}%`}`);

        // Date range filtering
        if (fromDate) {
            conditions.push(sql`${projects.createdAt} >= ${new Date(fromDate)}`);
        }
        if (toDate) {
            conditions.push(sql`${projects.createdAt} <= ${new Date(toDate)}`);
        }

        // If not admin and we have a user ID, only show assigned projects
        if (userRole !== "admin" && currentUserId) {
            // Subquery to find project IDs assigned to this user
            const userProjectIds = db.select({ projectId: userProjectAssignments.projectId })
                .from(userProjectAssignments)
                .where(eq(userProjectAssignments.userId, currentUserId));

            conditions.push(inArray(projects.id, userProjectIds));
        }

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
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
            isMemoRequired: projects.isMemoRequired,
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
                    email: user.email,
                    image: user.image,
                    role: user.role
                }
            })
                .from(userProjectAssignments)
                .innerJoin(user, eq(userProjectAssignments.userId, user.id))
                .where(inArray(userProjectAssignments.projectId, projectIds))
            : [];

        const projectsWithTeam = projectList.map(project => {
            // Calculate progress based on completedTime and totalTime
            let progress = 0;
            if (project.totalTime && project.completedTime) {
                const total = parseFloat(project.totalTime);
                const completed = parseFloat(project.completedTime);
                if (total > 0) {
                    progress = Math.min(Math.round((completed / total) * 100), 100);
                }
            }

            return {
                ...project,
                progress,
                team: allAssignments
                    .filter(a => a.projectId === project.id)
                    .map(a => a.user)
            };
        });

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

        const { name, clientId, status, totalTime, description, assignedUserIds, links: projectLinks, isMemoRequired } = validation.data;

        const [newProject] = await db.insert(projects).values({
            id: crypto.randomUUID(),
            name,
            clientId,
            status: status || "active",
            totalTime: totalTime || null,
            completedTime: null, // explicit null
            description: description || null, // explicit null
            isMemoRequired: isMemoRequired || false,
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

        // Handle project links
        if (projectLinks && projectLinks.length > 0) {
            await db.insert(links).values(
                projectLinks.map(link => ({
                    id: crypto.randomUUID(),
                    name: link.label,
                    url: link.value,
                    allowedRoles: link.allowedRoles || ["admin", "developer", "tester"],
                    projectId: newProject.id,
                    description: null,
                    clientId: null,
                    addedBy: null,
                }))
            );
        }

        // Create a chat group for the new project
        await db.insert(chatGroups).values({
            id: crypto.randomUUID(),
            name: `${name} Chat`,
            projectId: newProject.id,
        });

        // Emit socket event from server-side
        // Emit socket event from server-side using global io instance
        try {
            const io = (global as any).io;
            if (io) {
                console.log("✅ API Route found global.io. Emitting project-created...");
                io.emit("project-created", {
                    projectId: newProject.id,
                    project: newProject,
                    assignedUserIds: assignedUserIds || []
                });
                console.log("📤 Emitted project-created for project:", newProject.id);
            } else {
                console.warn("⚠️ global.io not found. Falling back to loopback connection...");
                // Fallback to loopback if global.io is missing (shouldn't happen with custom server)
                const { io: clientIo } = await import("socket.io-client");
                const socket = clientIo(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
                    path: "/api/socket",
                    addTrailingSlash: false,
                });

                socket.on("connect", () => {
                    socket.emit("project-created", {
                        projectId: newProject.id,
                        project: newProject,
                        assignedUserIds: assignedUserIds || []
                    });
                    setTimeout(() => socket.disconnect(), 500);
                });
            }
        } catch (socketError) {
            console.error("Failed to emit socket event:", socketError);
        }

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
