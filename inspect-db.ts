
import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function inspect() {
    try {
        console.log("--- Column Info ---");
        const columns = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('messages', 'user_project_assignments')
        `);
        console.log(JSON.stringify(columns, null, 2));

        console.log("\n--- Sample Data (user_project_assignments) ---");
        const assignments = await db.execute(sql`SELECT last_read_at FROM user_project_assignments LIMIT 5`);
        console.log(JSON.stringify(assignments, null, 2));

        console.log("\n--- Sample Data (messages) ---");
        const msgs = await db.execute(sql`SELECT created_at FROM messages LIMIT 5`);
        console.log(JSON.stringify(msgs, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

inspect();
