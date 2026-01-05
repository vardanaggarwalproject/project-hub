
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; 
import * as schema from "./db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", 
        schema: {
            // Map Better Auth tables to our Drizzle schema
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "developer",
            }
        }
    },
    emailAndPassword: {  
        enabled: true,
    },
    // Add other providers here if needed (e.g. Google, GitHub)
});
