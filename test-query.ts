
import { db } from "./src/lib/db";
import { userProjectAssignments, messages, chatGroups } from "./src/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

async function test() {
    try {
        console.log("Testing unread counts query...");
        const userId = "3196f30a-3932-45e3-9875-101188448ec1"; // A known user ID (admin probably)

        const unreadCounts = await db.select({
            projectId: userProjectAssignments.projectId,
            unreadCount: sql<number>`(
                SELECT COUNT(*) 
                FROM ${messages} 
                JOIN ${chatGroups} ON ${messages.groupId} = ${chatGroups.id}
                WHERE ${chatGroups.projectId} = ${userProjectAssignments.projectId}
                AND ${messages.createdAt}::timestamp > ${userProjectAssignments.lastReadAt}::timestamp
            )`.mapWith(Number)
        })
            .from(userProjectAssignments)
            .where(eq(userProjectAssignments.userId, userId));

        console.log("Result:", unreadCounts);
    } catch (e: any) {
        console.error("Query failed!");
        console.error("Error message:", e.message);
        console.error("Error Code:", e.code);
        console.error("Detail:", e.detail);
    }
}

test();
