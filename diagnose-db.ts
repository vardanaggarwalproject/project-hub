import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function diagnose() {
    try {
        console.log("=== DIAGNOSING DATABASE ===\n");

        // 1. Check if table exists
        console.log("1. Checking if user_project_assignments table exists...");
        const tableExists = await db.execute(sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_project_assignments'
            );
        `);
        console.log("Table exists:", tableExists.rows[0]?.exists);

        // 2. Get table structure
        console.log("\n2. Table structure:");
        const columns = await db.execute(sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'user_project_assignments'
            ORDER BY ordinal_position;
        `);
        console.table(columns.rows);

        // 3. Check for data
        console.log("\n3. Sample data (first 3 rows):");
        const sampleData = await db.execute(sql`
            SELECT * FROM user_project_assignments LIMIT 3;
        `);
        console.table(sampleData.rows);

        // 4. Count total rows
        console.log("\n4. Total rows:");
        const count = await db.execute(sql`
            SELECT COUNT(*) as total FROM user_project_assignments;
        `);
        console.log("Total:", count.rows[0]?.total);

        // 5. Check for the specific user
        console.log("\n5. Checking for user Sd1h3KvV4ea0JV5t9RGVJWA78SslDTCO:");
        const userAssignments = await db.execute(sql`
            SELECT * FROM user_project_assignments 
            WHERE user_id = 'Sd1h3KvV4ea0JV5t9RGVJWA78SslDTCO';
        `);
        console.log("Found assignments:", userAssignments.rows.length);
        console.table(userAssignments.rows);

        // 6. Check chat_groups table
        console.log("\n6. Chat groups:");
        const groups = await db.execute(sql`
            SELECT * FROM chat_groups LIMIT 5;
        `);
        console.table(groups.rows);

        process.exit(0);
    } catch (error: any) {
        console.error("\n❌ DIAGNOSTIC FAILED:");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Detail:", error.detail);
        console.error("\nFull error:", error);
        process.exit(1);
    }
}

diagnose();
