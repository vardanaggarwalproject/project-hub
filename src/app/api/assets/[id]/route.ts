import { db } from "@/lib/db";
import { assets, userProjectAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const assetUpdateSchema = z.object({
    name: z.string().min(1, "Name required").optional(),
    url: z.string().url("Must be a valid URL").optional(),
    allowedRoles: z.array(z.string()).optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = params.id;
        const body = await req.json();
        const validation = assetUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const data = validation.data;

        // Check ownership or admin status
        const [existingAsset] = await db.select({
            id: assets.id,
            projectId: assets.projectId,
            uploadedBy: assets.uploadedBy,
        })
            .from(assets)
            .where(eq(assets.id, id))
            .limit(1);

        if (!existingAsset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const isAdmin = session.user.role === "admin";

        // Check if user is assigned to the project the asset belongs to
        const assignment = await db.select()
            .from(userProjectAssignments)
            .where(
                and(
                    eq(userProjectAssignments.userId, session.user.id),
                    eq(userProjectAssignments.projectId, existingAsset.projectId)
                )
            )
            .limit(1);

        const isProjectMember = assignment.length > 0;

        if (!isAdmin && !isProjectMember) {
            return NextResponse.json({ error: "Forbidden: You don't have permission to modify this asset" }, { status: 403 });
        }

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.url) updateData.fileUrl = data.url;
        updateData.updatedAt = new Date();

        const [updatedAsset] = await db.update(assets)
            .set(updateData)
            .where(eq(assets.id, id))
            .returning();

        return NextResponse.json(updatedAsset);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = params.id;

        // Check ownership or admin status
        const [existingAsset] = await db.select()
            .from(assets)
            .where(eq(assets.id, id))
            .limit(1);

        if (!existingAsset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const isAdmin = session.user.role === "admin";

        // Check if user is assigned to the project the asset belongs to
        const assignment = await db.select()
            .from(userProjectAssignments)
            .where(
                and(
                    eq(userProjectAssignments.userId, session.user.id),
                    eq(userProjectAssignments.projectId, existingAsset.projectId)
                )
            )
            .limit(1);

        const isProjectMember = assignment.length > 0;

        if (!isAdmin && !isProjectMember) {
            return NextResponse.json({ error: "Forbidden: You don't have permission to delete this asset" }, { status: 403 });
        }

        await db.delete(assets).where(eq(assets.id, id));

        return NextResponse.json({ message: "Asset deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
