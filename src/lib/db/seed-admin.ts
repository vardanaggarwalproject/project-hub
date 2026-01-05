import { db } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { auth } from "../auth";

async function main() {
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];
    const name = args[2] || "System Admin";

    if (!email || !password) {
        console.error("Usage: pnpm db:seed-admin <email> <password> [name]");
        process.exit(1);
    }

    console.log("Seeding roles...");
    const roleNames = ["admin", "developer"];
    for (const name of roleNames) {
        const existing = await db.select().from(schema.roles).where(eq(schema.roles.name, name));
        if (existing.length === 0) {
            await db.insert(schema.roles).values({
                id: crypto.randomUUID(),
                name,
            });
            console.log(`Created role: ${name}`);
        }
    }

    console.log(`Creating admin user: ${email}`);
    
    try {
        // Better Auth signUp handles password hashing and user creation
        const user = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            }
        });

        if (user) {
            // Update the user's role to admin (it defaults to developer via the auth config)
            await db.update(schema.user)
                .set({ role: "admin" })
                .where(eq(schema.user.email, email));
            
            console.log("Admin user seeded successfully!");
        }
    } catch (error: any) {
        if (error.message?.includes("already exists")) {
            console.log("User already exists. Updating role to admin...");
             await db.update(schema.user)
                .set({ role: "admin" })
                .where(eq(schema.user.email, email));
            console.log("User role updated to admin.");
        } else {
            console.error("Error seeding admin:", error);
        }
    }

    process.exit(0);
}

main();
