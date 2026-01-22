import { db } from "@/lib/db";
import { projects, clients, user, userProjectAssignments, chatGroups, links, assets } from "@/lib/db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["active", "completed", "on-hold"]).optional(),
    clientId: z.string().optional(),
    assignedUserIds: z.array(z.string()).optional(),
    links: z.array(z.object({
        id: z.string().optional(),
        label: z.string(),
        value: z.string(),
        allowedRoles: z.array(z.string()).optional().default(["admin", "developer", "tester", "designer"]),
    })).optional(),
    isMemoRequired: z.boolean().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch basic project info
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

        const project = projectData[0];

        // Fetch team, handle errors gracefully
        let team: any[] = [];
        try {
            team = await db.select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role
            })
                .from(userProjectAssignments)
                .innerJoin(user, eq(userProjectAssignments.userId, user.id))
                .where(eq(userProjectAssignments.projectId, id));
        } catch (e) {
            console.error("Error fetching team:", e);
        }

        // Fetch project links, handle errors gracefully
        let projectLinks: any[] = [];
        try {
            projectLinks = await db.select({
                id: links.id,
                label: links.name,
                value: links.url,
            })
                .from(links)
                .where(eq(links.projectId, id));
        } catch (e) {
            console.error("Error fetching links:", e);
        }

        // Fetch project assets, handle errors gracefully
        let projectAssets: any[] = [];
        try {
            projectAssets = await db.select({
                id: assets.id,
                name: assets.name,
                fileUrl: assets.fileUrl,
                url: assets.fileUrl, // For backward compatibility
                fileType: assets.fileType,
                fileSize: assets.fileSize,
                size: assets.fileSize, // For backward compatibility
            })
                .from(assets)
                .where(eq(assets.projectId, id));
        } catch (e) {
            console.error("Error fetching assets:", e);
        }

        // Calculate progress
        let progress = 0;
        try {
            const totalNum = parseFloat(project.totalTime || "0");
            const completedNum = parseFloat(project.completedTime || "0");
            if (!isNaN(totalNum) && !isNaN(completedNum) && totalNum > 0) {
                progress = Math.min(Math.round((completedNum / totalNum) * 100), 100);
            }
        } catch (e) {
            console.error("Error calculating progress:", e);
        }

        return NextResponse.json({
            ...project,
            progress,
            team,
            links: projectLinks,
            assets: projectAssets
        });
    } catch (error: any) {
        console.error("GET Project Error:", error);
        return NextResponse.json({
            error: "Failed to fetch project",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
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

        // Get current project status
        const currentProject = await db.select({ status: projects.status })
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        const oldStatus = currentProject[0]?.status;

        // Update project metadata
        await db.update(projects)
            .set({
                name: name ?? undefined,
                description: description ?? undefined,
                status: status ?? undefined,
                clientId: clientId ?? undefined,
                isMemoRequired: isMemoRequired ?? undefined,
                updatedAt: sql`NOW()`,
            })
            .where(eq(projects.id, id));

        // If status changed from active, reset all assignments to inactive
        if (oldStatus === 'active' && (status === 'on-hold' || status === 'completed')) {
            await db.update(userProjectAssignments)
                .set({ isActive: false })
                .where(eq(userProjectAssignments.projectId, id));
        }

        // Update team assignments
        if (assignedUserIds !== undefined) {
            // 1. Get current assignments
            const existingAssignments = await db.select()
                .from(userProjectAssignments)
                .where(eq(userProjectAssignments.projectId, id));

            const existingUserIds = existingAssignments.map(a => a.userId);
            const uniqueAssignedUserIds = Array.from(new Set(assignedUserIds));

            // 2. Determine users to add and remove
            const usersToAdd = uniqueAssignedUserIds.filter(uid => !existingUserIds.includes(uid));
            const usersToRemove = existingUserIds.filter(uid => !uniqueAssignedUserIds.includes(uid));

            // 3. Remove unassigned users
            if (usersToRemove.length > 0) {
                await db.delete(userProjectAssignments)
                    .where(
                        and(
                            eq(userProjectAssignments.projectId, id),
                            inArray(userProjectAssignments.userId, usersToRemove)
                        )
                    );
            }

            // 4. Add new users (start as inactive)
            if (usersToAdd.length > 0) {
                await db.insert(userProjectAssignments).values(
                    usersToAdd.map(userId => ({
                        id: crypto.randomUUID(),
                        userId,
                        projectId: id,
                        isActive: false
                    }))
                );
            }
        }

        // Update project links
        if (projectLinks !== undefined) {
            // 1. Get current links
            const existingLinks = await db.select()
                .from(links)
                .where(eq(links.projectId, id));

            const existingLinkIds = existingLinks.map(l => l.id);
            const incomingLinkIds = projectLinks.map(l => l.id).filter(Boolean) as string[];

            // 2. Identify links to remove
            const linksToRemove = existingLinkIds.filter(id => !incomingLinkIds.includes(id));
            if (linksToRemove.length > 0) {
                await db.delete(links).where(inArray(links.id, linksToRemove));
            }

            // 3. Update existing links and Add new ones
            for (const link of projectLinks) {
                if (link.id && existingLinkIds.includes(link.id)) {
                    // Update existing
                    await db.update(links)
                        .set({
                            name: link.label,
                            url: link.value,
                            allowedRoles: link.allowedRoles,
                            updatedAt: new Date(),
                        })
                        .where(eq(links.id, link.id));
                } else {
                    // Add new
                    await db.insert(links).values({
                        id: crypto.randomUUID(),
                        name: link.label,
                        url: link.value,
                        projectId: id,
                        allowedRoles: link.allowedRoles || ["admin", "developer", "tester", "designer"],
                    });
                }
            }
        }

        // Handle chat group name
        const existingGroup = await db.select().from(chatGroups).where(eq(chatGroups.projectId, id)).limit(1);
        if (existingGroup.length > 0 && name) {
            await db.update(chatGroups).set({ name: `${name} Chat` }).where(eq(chatGroups.projectId, id));
        }

        // Socket Event
        try {
            const io = (global as any).io;
            if (io) {
                io.emit("project-updated", { projectId: id });
            }
        } catch (e) { }

        return NextResponse.json({ message: "Project updated successfully" });
    } catch (error) {
        console.error("PATCH Project Error:", error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
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
