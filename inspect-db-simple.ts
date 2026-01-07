
import { db } from "./src/lib/db";
import { userProjectAssignments, messages } from "./src/lib/db/schema";
import { sql } from "drizzle-orm";

async function inspect() {
    try {
        const assignments = await db.select().from(userProjectAssignments).limit(5);
        console.log("Assignments Sample:", JSON.stringify(assignments, null, 2));

        const msgSample = await db.select().from(messages).limit(5);
        console.log("Messages Sample:", JSON.stringify(msgSample, null, 2));

        const types = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('user_project_assignments', 'messages')
        `);
        console.log("Column Types:", JSON.stringify(types, null, 2));
    } catch (e: any) {
        console.error("Inspect failed:", e.message);
    }
}

inspect();
