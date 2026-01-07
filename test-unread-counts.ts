
import { db } from "./src/lib/db";
import { chatGroups, messages, userProjectAssignments } from "./src/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

async function testQuery() {
    try {
        console.log("Starting test query...");
        const userId = "3196f30a-3932-45e3-9875-101188448ec1"; // Admin ID from previous attempts

        const allProjects = await db.select({
            projectId: chatGroups.projectId,
            lastReadAt: userProjectAssignments.lastReadAt,
        })
            .from(chatGroups)
            .leftJoin(userProjectAssignments, and(
                eq(userProjectAssignments.projectId, chatGroups.projectId),
                eq(userProjectAssignments.userId, sql`${userId}`)
            ));

        console.log("Projects to track:", allProjects.length);

        for (const p of allProjects) {
            console.log(`Checking project ${p.projectId}...`);
            const lastRead = p.lastReadAt || '1970-01-01T00:00:00.000Z';

            const countRes = await db.select({
                count: sql<number>`count(*)`.mapWith(Number)
            })
                .from(messages)
                .innerJoin(chatGroups, eq(messages.groupId, chatGroups.id))
                .where(and(
                    eq(chatGroups.projectId, p.projectId),
                    sql`${messages.createdAt}::timestamp > ${lastRead}::timestamp`
                ));

            console.log(`Project ${p.projectId}: ${countRes[0]?.count} unread`);
        }
        console.log("Test query completed successfully.");
    } catch (e: any) {
        console.error("Test query FAILED!");
        console.error("Error Message:", e.message);
        console.error("Error Code:", e.code);
        console.error("Detail:", e.detail);
    }
}

testQuery();
