import { db } from "@/lib/db";
import { projects, clients, user, userProjectAssignments, chatGroups, links } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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
        allowedRoles: z.array(z.string()).optional().default(["admin", "developer", "tester"]),
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

        // Update team assignments if provided
        if (assignedUserIds !== undefined) {
            // Remove existing assignments
            await db.delete(userProjectAssignments)
                .where(eq(userProjectAssignments.projectId, id));

            // Add new assignments
            if (assignedUserIds.length > 0) {
                await db.insert(userProjectAssignments).values(
                    assignedUserIds.map(userId => ({
                        id: crypto.randomUUID(),
                        userId,
                        projectId: id
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
                        allowedRoles: link.allowedRoles || ["admin", "developer", "tester"],
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
