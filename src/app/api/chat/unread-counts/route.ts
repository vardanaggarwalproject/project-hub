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
                // Admin sees all projects
                result = await db.execute(sql`
                    SELECT 
                        cg.project_id as "projectId",
                        COALESCE(
                            (SELECT COUNT(*)::int 
                             FROM messages m
                             WHERE m.group_id = cg.id 
                               AND m.sender_id != ${userId}
                               AND m.created_at > COALESCE(
                                   (SELECT last_read_at 
                                    FROM user_project_assignments 
                                    WHERE user_id = ${userId} 
                                      AND project_id = cg.project_id 
                                    LIMIT 1),
                                   '1970-01-01 00:00:00'::timestamp
                               )
                            ), 
                            0
                        ) as "count"
                    FROM chat_groups cg
                `);
            } else {
                // Regular users see ALL their assigned projects (regardless of is_active status)
                // is_active is for project management, not message delivery
                result = await db.execute(sql`
                    SELECT 
                        upa.project_id as "projectId",
                        COALESCE(
                            (SELECT COUNT(*)::int 
                             FROM messages m
                             JOIN chat_groups cg ON m.group_id = cg.id
                             WHERE cg.project_id = upa.project_id
                               AND m.sender_id != ${userId}
                               AND m.created_at > COALESCE(upa.last_read_at, '1970-01-01 00:00:00'::timestamp)
                            ), 
                            0
                        ) as "count"
                    FROM user_project_assignments upa
                    WHERE upa.user_id = ${userId}
                `);
            }

            console.log(`📊 [Unread API] User: ${userId}, Role: ${isAdmin ? 'admin' : 'user'}`);
            console.log(`📊 [Unread API] Query returned ${result.rows?.length || 0} rows`);
            console.log(`📊 [Unread API] Raw rows:`, JSON.stringify(result.rows, null, 2));

            const response: Record<string, number> = {};
            if (result.rows) {
                result.rows.forEach((row: any) => {
                    // Normalize keys and ensure count is a number
                    const projectId = row.projectId || row.project_id;
                    const count = parseInt(row.count || row.COUNT || 0, 10);
                    if (projectId) {
                        response[projectId] = count;
                        console.log(`📊 [Unread API] Project ${projectId}: ${count} unread`);
                    }
                });
            }

            console.log(`📊 [Unread API] Final response:`, response);
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
