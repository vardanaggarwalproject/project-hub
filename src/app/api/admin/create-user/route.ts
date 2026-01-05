
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { email, password, name, role } = await req.json();

    try {
        // 1. Create user via Better Auth
        const newUser = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            }
        });

        if (!newUser) {
            throw new Error("Failed to create user account");
        }

        // 2. Update the role (since by default it might be 'developer')
        await db.update(userTable)
            .set({ role: role || "developer" })
            .where(eq(userTable.email, email));

        return NextResponse.json({ message: "User created successfully" }, { status: 201 });
    } catch (error: any) {
        console.error("Admin user creation error:", error);
        return NextResponse.json({ 
            message: error.message || "An error occurred during user creation" 
        }, { status: 400 });
    }
}
