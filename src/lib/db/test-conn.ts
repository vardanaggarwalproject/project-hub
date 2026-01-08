console.log("Script starting...");
import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Testing DB connection...");
    try {
        const result = await db.execute(sql`SELECT 1`);
        console.log("DB Connection successful:", result);
    } catch (error) {
        console.error("DB Connection failed:", error);
    }
    process.exit(0);
}

main();
