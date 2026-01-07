import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;
        const userId = session.user.id;
        const now = new Date().toISOString();

        try {
            // Check if assignment exists
            const checkResult = await db.execute(sql`
                SELECT id FROM user_project_assignments 
                WHERE user_id = ${userId} AND project_id = ${projectId}
                LIMIT 1
            `);

            if (checkResult.rows && checkResult.rows.length > 0) {
                // Update existing
                const assignmentId = (checkResult.rows[0] as any).id;
                await db.execute(sql`
                    UPDATE user_project_assignments 
                    SET last_read_at = ${now}, updated_at = ${now}
                    WHERE id = ${assignmentId}
                `);

                return NextResponse.json({ success: true, action: "updated" });
            } else if (session.user.role === "admin") {
                // Create for admin if missing
                const newId = crypto.randomUUID();
                await db.execute(sql`
                    INSERT INTO user_project_assignments 
                    (id, user_id, project_id, last_read_at, updated_at, assigned_at, created_at, is_active)
                    VALUES (${newId}, ${userId}, ${projectId}, ${now}, ${now}, ${now}, ${now}, true)
                `);
                return NextResponse.json({ success: true, action: "created" });
            }

            return NextResponse.json({ success: true, action: "none" });
        } catch (dbError: any) {
            console.error("Database error in mark-as-read:", dbError);
            return NextResponse.json({
                error: "Database operation failed",
                message: dbError.message,
                code: dbError.code,
                detail: dbError.detail
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Error marking as read:", error);
        return NextResponse.json({
            error: "Failed to mark as read",
            message: error.message
        }, { status: 500 });
    }
}
