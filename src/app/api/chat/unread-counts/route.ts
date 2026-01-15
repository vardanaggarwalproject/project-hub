import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const isAdmin = session.user.role === "admin";

        try {
            // CRITICAL FIX: Query must return counts for ALL projects user is assigned to
            // Even if user_project_assignments row doesn't exist or last_read_at is NULL
            let result;
            if (isAdmin) {
                // Admin sees all projects - JOIN with messages and calculate unread
                // A message is unread if created_at > user's last_read_at for that project
                result = await db.execute(sql`
                    SELECT 
                        cg.project_id as "projectId",
                        COUNT(m.id)::int as "count"
                    FROM chat_groups cg
                    LEFT JOIN user_project_assignments upa ON upa.project_id = cg.project_id AND upa.user_id = ${userId}
                    LEFT JOIN messages m ON m.group_id = cg.id 
                        AND m.sender_id != ${userId}
                        AND m.created_at > COALESCE(upa.last_read_at, '1970-01-01 00:00:00'::timestamp)
                    GROUP BY cg.project_id
                `);
            } else {
                // Regular users see counts for their assigned projects
                result = await db.execute(sql`
                    SELECT 
                        upa.project_id as "projectId",
                        COUNT(m.id)::int as "count"
                    FROM user_project_assignments upa
                    JOIN chat_groups cg ON upa.project_id = cg.project_id
                    LEFT JOIN messages m ON m.group_id = cg.id
                        AND m.sender_id != ${userId}
                        AND m.created_at > COALESCE(upa.last_read_at, '1970-01-01 00:00:00'::timestamp)
                    WHERE upa.user_id = ${userId}
                    GROUP BY upa.project_id
                `);
            }

            const response: Record<string, number> = {};
            if (result.rows) {
                result.rows.forEach((row: any) => {
                    const projectId = row.projectId || row.project_id;
                    const count = parseInt(row.count || row.COUNT || 0, 10);
                    if (projectId) {
                        response[projectId] = count;
                    }
                });
            }
            return NextResponse.json(response);
        } catch (dbError: any) {
            console.error("Database error in unread-counts:", dbError);
            return NextResponse.json({
                error: "Database query failed",
                message: dbError.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Fatal error in unread-counts:", error);
        return NextResponse.json({
            error: "Failed to fetch unread counts"
        }, { status: 500 });
    }
}
