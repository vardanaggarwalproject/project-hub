import { db } from "@/lib/db";
import { projects, clients, user, userProjectAssignments, chatGroups, links } from "@/lib/db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["active", "completed", "on-hold"]).optional(),
    clientId: z.string().optional(),
    assignedUserIds: z.array(z.string()).optional(),
    links: z.array(z.object({
        label: z.string(),
        value: z.string(),
        allowedRoles: z.array(z.string()).optional().default(["admin", "developer", "tester", "designer"]),
    })).optional(),
    isMemoRequired: z.boolean().optional(),
});


export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const projectData = await db.select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            status: projects.status,
            totalTime: projects.totalTime,
            completedTime: projects.completedTime,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
            clientId: projects.clientId,
            clientName: clients.name,
            isMemoRequired: projects.isMemoRequired,
        })
            .from(projects)
            .leftJoin(clients, eq(projects.clientId, clients.id))


            .where(eq(projects.id, id))
            .limit(1);

        if (!projectData.length) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Fetch team
        const team = await db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role
        })
            .from(userProjectAssignments)
            .innerJoin(user, eq(userProjectAssignments.userId, user.id))
            .where(eq(userProjectAssignments.projectId, id));

        // Fetch project links
        const projectLinks = await db.select({
            id: links.id,
            label: links.name,
            value: links.url,
            allowedRoles: links.allowedRoles,
        })
            .from(links)
            .where(eq(links.projectId, id));

        // Calculate progress based on completedTime and totalTime
        const project = projectData[0];
        let progress = 0;
        if (project.totalTime && project.completedTime) {
            const total = parseFloat(project.totalTime);
            const completed = parseFloat(project.completedTime);
            if (total > 0) {
                progress = Math.min(Math.round((completed / total) * 100), 100);
            }
        }

        return NextResponse.json({
            ...project,
            progress,
            team,
            links: projectLinks
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validation = updateProjectSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { name, description, status, clientId, assignedUserIds, links: projectLinks, isMemoRequired } = validation.data;

        // Get current project status before update
        const currentProject = await db.select({ status: projects.status })
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        const oldStatus = currentProject[0]?.status;

        // Update project metadata
        await db.update(projects)
            .set({
                name,
                description,
                status,
                clientId,
                isMemoRequired,
                updatedAt: sql`NOW()`,
            })
            .where(eq(projects.id, id));

        // If status changed from active to on-hold or completed, reset all assignments to inactive
        if (oldStatus === 'active' && (status === 'on-hold' || status === 'completed')) {
            await db.update(userProjectAssignments)
                .set({ isActive: false })
                .where(eq(userProjectAssignments.projectId, id));
        }

        // Update team assignments if provided
        if (assignedUserIds !== undefined) {
            // 1. First, cleanup ANY existing duplicates for this project to ensure data integrity
            const allExisting = await db.select()
                .from(userProjectAssignments)
                .where(eq(userProjectAssignments.projectId, id));

            const userToAssignments = new Map<string, any[]>();
            allExisting.forEach(a => {
                if (!userToAssignments.has(a.userId)) userToAssignments.set(a.userId, []);
                userToAssignments.get(a.userId)!.push(a);
            });

            for (const [userId, assignments] of userToAssignments.entries()) {
                if (assignments.length > 1) {
                    // Keep the one that is active, or has the latest updatedAt
                    const sorted = assignments.sort((a, b) => {
                        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                    });

                    const toKeep = sorted[0];
                    const toDelete = sorted.slice(1).map(a => a.id);

                    await db.delete(userProjectAssignments)
                        .where(inArray(userProjectAssignments.id, toDelete));
                }
            }

            // 2. Now get the cleaned assignments for comparison
            const cleanedAssignments = await db.select()
                .from(userProjectAssignments)
                .where(eq(userProjectAssignments.projectId, id));

            // De-duplicate incoming IDs
            const uniqueAssignedUserIds = Array.from(new Set(assignedUserIds));
            const existingUserIds = cleanedAssignments.map(a => a.userId);

            // 3. Determine users to add and remove
            const usersToAdd = uniqueAssignedUserIds.filter(uid => !existingUserIds.includes(uid));
            const usersToRemove = existingUserIds.filter(uid => !uniqueAssignedUserIds.includes(uid));

            // 4. Remove unassigned users
            if (usersToRemove.length > 0) {
                await db.delete(userProjectAssignments)
                    .where(
                        and(
                            eq(userProjectAssignments.projectId, id),
                            inArray(userProjectAssignments.userId, usersToRemove)
                        )
                    );
            }

            // 5. Add new users
            if (usersToAdd.length > 0) {
                await db.insert(userProjectAssignments).values(
                    usersToAdd.map(userId => ({
                        id: crypto.randomUUID(),
                        userId,
                        projectId: id,
                        isActive: false // New assignments start as inactive by default
                    }))
                );
            }
        }

        // Update project links if provided
        if (projectLinks !== undefined) {
            // Remove existing links
            await db.delete(links)
                .where(eq(links.projectId, id));

            // Add new links
            if (projectLinks.length > 0) {
                await db.insert(links).values(
                    projectLinks.map(link => ({
                        id: crypto.randomUUID(),
                        name: link.label,
                        url: link.value,
                        allowedRoles: link.allowedRoles || ["admin", "developer", "tester", "designer"],
                        projectId: id,
                        description: null,
                        clientId: null,
                        addedBy: null,
                    }))
                );
            }
        }

        // Ensure chat group exists for this project
        const existingGroup = await db.select()
            .from(chatGroups)
            .where(eq(chatGroups.projectId, id))
            .limit(1);

        if (existingGroup.length === 0) {
            // Get project name for chat group
            const project = await db.select({ name: projects.name })
                .from(projects)
                .where(eq(projects.id, id))
                .limit(1);

            await db.insert(chatGroups).values({
                id: crypto.randomUUID(),
                name: `${project[0]?.name || 'Project'} Chat`,
                projectId: id,
            });
        } else if (name) {
            // Update chat group name if project name changed
            await db.update(chatGroups)
                .set({ name: `${name} Chat` })
                .where(eq(chatGroups.projectId, id));
        }

        // Emit socket event for real-time updates
        try {
            const io = (global as any).io;
            if (io) {
                // Fetch updated project with client name for the socket event
                const updatedProjectData = await db.select({
                    id: projects.id,
                    name: projects.name,
                    description: projects.description,
                    status: projects.status,
                    totalTime: projects.totalTime,
                    completedTime: projects.completedTime,
                    createdAt: projects.createdAt,
                    updatedAt: projects.updatedAt,
                    clientId: projects.clientId,
                    clientName: clients.name,
                    isMemoRequired: projects.isMemoRequired,
                })
                    .from(projects)
                    .leftJoin(clients, eq(projects.clientId, clients.id))
                    .where(eq(projects.id, id))
                    .limit(1);

                if (updatedProjectData.length > 0) {
                    io.emit("project-updated", {
                        projectId: id,
                        project: updatedProjectData[0]
                    });
                }
            }
        } catch (socketError) {
            console.error("Failed to emit socket event:", socketError);
        }

        return NextResponse.json({ message: "Project updated successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.delete(projects).where(eq(projects.id, id));
        return NextResponse.json({ message: "Project deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
