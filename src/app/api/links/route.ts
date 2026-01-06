
import { db } from "@/lib/db";
import { links, user } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const linkSchema = z.object({
    title: z.string().min(1, "Title required"),
    url: z.string().url("Must be a valid URL"),
    category: z.string().optional(),
    projectId: z.string().min(1, "Project ID required"),
    addedBy: z.string().min(1, "User ID required"),
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
            updatedAt: links.updatedAt,
            uploader: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
        .from(links)
        .leftJoin(user, eq(links.addedBy, user.id))
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
        const body = await req.json();
        const validation = linkSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const data = validation.data;

        const [newLink] = await db.insert(links).values({
            id: crypto.randomUUID(),
            name: data.title,
            url: data.url,
            description: data.category,
            projectId: data.projectId,
            addedBy: data.addedBy,
        }).returning();

        return NextResponse.json(newLink, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
    }
}
