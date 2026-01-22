import { db } from "@/lib/db";
import { links, user, projects, userProjectAssignments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const linkSchema = z.object({
    title: z.string().min(1, "Title required"),
    url: z.string().url("Must be a valid URL"),
    category: z.string().optional(),
    projectId: z.string().min(1, "Project ID required"),
    addedBy: z.string().min(1, "User ID required").optional(), // Made optional as we'll use session ID
    allowedRoles: z.array(z.string()).optional().default(["admin", "developer", "tester", "designer"]),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        let whereClause = undefined;
        if (projectId) {
            whereClause = eq(links.projectId, projectId);
        }

        const linkList = await db.select({
            id: links.id,
            title: links.name,
            url: links.url,
            category: links.description,
            allowedRoles: links.allowedRoles,
            createdAt: links.createdAt,
            updatedAt: links.updatedAt,
            projectId: links.projectId,
            projectName: projects.name,
            uploader: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
            .from(links)
            .leftJoin(user, eq(links.addedBy, user.id))
            .leftJoin(projects, eq(links.projectId, projects.id))
            .where(whereClause)
            .orderBy(desc(links.updatedAt));

        return NextResponse.json(linkList);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = linkSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const data = validation.data;
        const userId = session.user.id;
        const userRole = session.user.role;

        // Authorization check: Admin OR Project Member
        if (userRole !== "admin") {
            const assignment = await db.select()
                .from(userProjectAssignments)
                .where(
                    and(
                        eq(userProjectAssignments.projectId, data.projectId),
                        eq(userProjectAssignments.userId, userId)
                    )
                )
                .limit(1);

            if (assignment.length === 0) {
                return NextResponse.json({ error: "Unauthorized: You are not assigned to this project" }, { status: 403 });
            }
        }

        const [newLink] = await db.insert(links).values({
            id: crypto.randomUUID(),
            name: data.title,
            url: data.url,
            description: data.category,
            projectId: data.projectId,
            addedBy: userId,
            allowedRoles: data.allowedRoles,
        }).returning();

        return NextResponse.json(newLink, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
    }
}
