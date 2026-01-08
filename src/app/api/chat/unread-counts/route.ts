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
            // Use Drizzle select for better mapping
            let result;
            if (isAdmin) {
                result = await db.execute(sql`
                    SELECT 
                        cg.project_id as "projectId",
                        COUNT(m.id)::int as "count"
                    FROM chat_groups cg
                    LEFT JOIN user_project_assignments upa 
                        ON cg.project_id = upa.project_id 
                        AND upa.user_id = ${userId}
                    LEFT JOIN messages m 
                        ON cg.id = m.group_id 
                        AND m.sender_id != ${userId}
                        AND m.created_at > COALESCE(upa.last_read_at, '1970-01-01 00:00:00')
                    GROUP BY cg.project_id
                `);
            } else {
                result = await db.execute(sql`
                    SELECT 
                        cg.project_id as "projectId",
                        COUNT(m.id)::int as "count"
                    FROM chat_groups cg
                    INNER JOIN user_project_assignments upa 
                        ON cg.project_id = upa.project_id 
                        AND upa.user_id = ${userId}
                        AND upa.is_active = true
                    LEFT JOIN messages m 
                        ON cg.id = m.group_id 
                        AND m.sender_id != ${userId}
                        AND m.created_at > COALESCE(upa.last_read_at, '1970-01-01 00:00:00')
                    GROUP BY cg.project_id
                `);
            }

            const response: Record<string, number> = {};
            if (result.rows) {
                result.rows.forEach((row: any) => {
                    // Normalize keys and ensure count is a number
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
