
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Ensure roles exist
        const roleNames = ["admin", "developer", "tester", "designer"] as const;
        for (const roleName of roleNames) {
            const existing = await db.select().from(schema.roles).where(eq(schema.roles.name, roleName));
            if (existing.length === 0) {
                await db.insert(schema.roles).values({
                    id: crypto.randomUUID(),
                    name: roleName,
                });
            }
        }

        // 2. Create the admin user
        const newUser = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            }
        });

        if (newUser) {
            // Update the user's role to admin
            await db.update(schema.user)
                .set({ role: "admin" })
                .where(eq(schema.user.email, email));

            return NextResponse.json({ message: "Admin user seeded successfully!" }, { status: 201 });
        }

        return NextResponse.json({ error: "Failed to create user" }, { status: 400 });

    } catch (error: any) {
        if (error.message?.includes("already exists")) {
            const { email } = await req.json().catch(() => ({}));
            if (email) {
                await db.update(schema.user)
                    .set({ role: "admin" })
                    .where(eq(schema.user.email, email));
                return NextResponse.json({ message: "User already exists. Role updated to admin." });
            }
        }
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
    }
}
