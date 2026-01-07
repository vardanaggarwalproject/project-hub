
import { db } from "./src/lib/db";
import { userProjectAssignments, chatGroups, messages } from "./src/lib/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

async function verify() {
    try {
        console.log("Checking user assignments...");
        const assignments = await db.select().from(userProjectAssignments).limit(5);
        console.log("Assignments found:", assignments.length);
        if (assignments.length > 0) {
            console.log("First assignment lastReadAt type:", typeof assignments[0].lastReadAt, assignments[0].lastReadAt);
        }

        console.log("\nChecking chat groups...");
        const groups = await db.select().from(chatGroups).limit(5);
        console.log("Chat groups found:", groups.length);

        console.log("\nTesting unread counts logic...");
        if (assignments.length > 0) {
            const userId = assignments[0].userId;
            const counts = await db.select({
                projectId: userProjectAssignments.projectId,
                unreadCount: sql<number>`count(${messages.id})`.mapWith(Number)
            })
                .from(userProjectAssignments)
                .innerJoin(chatGroups, eq(userProjectAssignments.projectId, chatGroups.projectId))
                .leftJoin(messages, and(
                    eq(messages.groupId, chatGroups.id),
                    gt(messages.createdAt, userProjectAssignments.lastReadAt)
                ))
                .where(eq(userProjectAssignments.userId, userId))
                .groupBy(userProjectAssignments.projectId);

            console.log(`Unread counts for user ${userId}:`, counts);
        }

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verify();
