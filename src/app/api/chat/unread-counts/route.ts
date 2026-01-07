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
            let query;

            if (isAdmin) {
                // Admin sees all projects
                query = sql`
                    SELECT 
                        cg.project_id,
                        COUNT(m.id)::int as count
                    FROM chat_groups cg
                    LEFT JOIN user_project_assignments upa 
                        ON cg.project_id = upa.project_id 
                        AND upa.user_id = ${userId}
                    LEFT JOIN messages m 
                        ON cg.id = m.group_id 
                        AND m.created_at > COALESCE(upa.last_read_at, '1970-01-01 00:00:00')
                    GROUP BY cg.project_id
                `;
            } else {
                // Regular users see only assigned projects
                query = sql`
                    SELECT 
                        cg.project_id,
                        COUNT(m.id)::int as count
                    FROM chat_groups cg
                    INNER JOIN user_project_assignments upa 
                        ON cg.project_id = upa.project_id 
                        AND upa.user_id = ${userId}
                        AND upa.is_active = true
                    LEFT JOIN messages m 
                        ON cg.id = m.group_id 
                        AND m.created_at > COALESCE(upa.last_read_at, '1970-01-01 00:00:00')
                    GROUP BY cg.project_id
                `;
            }

            const result = await db.execute(query);

            const response: Record<string, number> = {};
            if (result.rows) {
                result.rows.forEach((row: any) => {
                    response[row.project_id] = row.count || 0;
                });
            }

            return NextResponse.json(response);
        } catch (dbError: any) {
            console.error("Database error in unread-counts:", dbError);
            return NextResponse.json({
                error: "Database query failed",
                message: dbError.message,
                code: dbError.code,
                detail: dbError.detail,
                hint: dbError.hint
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Fatal error in unread-counts:", error);
        return NextResponse.json({
            error: "Failed to fetch unread counts",
            message: error.message
        }, { status: 500 });
    }
}
