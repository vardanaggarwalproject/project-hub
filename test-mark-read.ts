
import { db } from "./src/lib/db";
import { userProjectAssignments } from "./src/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function testMarkRead() {
    const userId = "Sd1h3KvV4ea0JV5t9RGVJWA78SslDTCO";
    const projectId = "eebefc58-364e-4d1a-83e9-f708540f814a";

    try {
        console.log(`Attempting to mark as read for User: ${userId}, Project: ${projectId}`);

        // 1. Try to find the record first
        const record = await db.select().from(userProjectAssignments).where(and(
            eq(userProjectAssignments.userId, userId),
            eq(userProjectAssignments.projectId, projectId)
        )).limit(1);

        console.log("Current record:", record[0] ? "Found" : "Not found");

        if (!record[0]) {
            console.log("Record not found, skipping update test.");
            // Try to insert it if it doesn't exist?
            /*
            await db.insert(userProjectAssignments).values({
                id: crypto.randomUUID(),
                userId,
                projectId,
                lastReadAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                assignedAt: new Date().toISOString()
            });
            console.log("Inserted new record.");
            */
            return;
        }

        // 2. Try update with sql`NOW()`
        console.log("Testing update with sql`NOW()`...");
        const result = await db.update(userProjectAssignments)
            .set({
                lastReadAt: sql`NOW()`,
                updatedAt: sql`NOW()`
            })
            .where(and(
                eq(userProjectAssignments.userId, userId),
                eq(userProjectAssignments.projectId, projectId)
            ))
            .returning();

        console.log("Update with sql`NOW()` successful:", result.length);

    } catch (error: any) {
        console.error("Update FAILED!");
        console.error("Error Message:", error.message);
        console.error("Error Code:", error.code);
        console.error("Detail:", error.detail);
        console.error("Constraint:", error.constraint);
        console.error("Stack:", error.stack);
    }
}

testMarkRead();
