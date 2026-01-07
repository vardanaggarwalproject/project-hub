
import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting migration: Convert role fields to enum...");

    try {
        // 1. Create the enum type if it doesn't exist
        console.log("Creating role_enum type...");
        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE role_enum AS ENUM ('admin', 'developer', 'tester', 'designer');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Drop the foreign key constraint first
        console.log("Dropping foreign key constraint...");
        // Note: The constraint name might vary depending on how Drizzle generated it.
        // We'll try to find it dynamically or use common naming patterns.
        await db.execute(sql`
            ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_role_roles_name_fk";
        `);

        // 3. Alter roles table name column
        console.log("Altering roles table...");
        await db.execute(sql`
            ALTER TABLE "roles" 
            ALTER COLUMN "name" TYPE role_enum 
            USING "name"::role_enum;
        `);

        // 4. Alter user table role column
        console.log("Altering user table...");
        await db.execute(sql`
            ALTER TABLE "user" 
            ALTER COLUMN "role" TYPE role_enum 
            USING "role"::role_enum;
        `);

        // 5. Re-add the foreign key constraint
        console.log("Re-adding foreign key constraint...");
        await db.execute(sql`
            ALTER TABLE "user" 
            ADD CONSTRAINT "user_role_roles_name_fk" 
            FOREIGN KEY ("role") REFERENCES "roles"("name");
        `);

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
