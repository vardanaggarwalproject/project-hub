import { db } from "@/lib/db";
import { assets, user, projects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const assetSchema = z.object({
    name: z.string().min(1, "Name required"),
    url: z.string().url("Must be a valid URL"),
    fileType: z.string().optional(),
    size: z.number().optional(),
    projectId: z.string().min(1, "Project ID required"),
    uploadedBy: z.string().min(1, "User ID required"),
    allowedRoles: z.array(z.string()).optional().default(["admin", "developer", "tester", "designer"]),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        let whereClause = undefined;
        if (projectId) {
            whereClause = eq(assets.projectId, projectId);
        }

        const assetList = await db.select({
            id: assets.id,
            name: assets.name,
            fileUrl: assets.fileUrl,
            fileType: assets.fileType,
            fileSize: assets.fileSize,
            createdAt: assets.createdAt,
            updatedAt: assets.updatedAt,
            projectId: assets.projectId,
            projectName: projects.name,
            uploader: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
            .from(assets)
            .leftJoin(user, eq(assets.uploadedBy, user.id))
            .leftJoin(projects, eq(assets.projectId, projects.id))
            .where(whereClause)
            .orderBy(desc(assets.updatedAt));

        return NextResponse.json(assetList);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = assetSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const data = validation.data;

        const [newAsset] = await db.insert(assets).values({
            id: crypto.randomUUID(),
            name: data.name,
            fileUrl: data.url,
            fileType: data.fileType,
            fileSize: data.size ? data.size.toString() : null,
            projectId: data.projectId,
            uploadedBy: data.uploadedBy,
        }).returning();

        return NextResponse.json(newAsset, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
    }
}
