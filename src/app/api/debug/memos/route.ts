
import { db } from "@/lib/db";
import { memos, user, projects } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const users = await db.select().from(user).where(ilike(user.name, "%Aman%"));
        const targetUser = users[0];

        const proj = await db.select().from(projects).where(ilike(projects.name, "%Connexio%"));
        const targetProject = proj[0];

        if (!targetUser || !targetProject) {
            return NextResponse.json({ error: "User or Project not found", user: targetUser, project: targetProject });
        }

        const results = await db.select().from(memos)
            .where(and(
                eq(memos.userId, targetUser.id),
                eq(memos.projectId, targetProject.id)
            ));

        return NextResponse.json({
            user: targetUser.name,
            project: targetProject.name,
            isMemoRequired: targetProject.isMemoRequired,
            memos: results
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
