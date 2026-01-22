import { db } from "@/lib/db";
import { extraNotificationEmails } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * GET /api/notifications/extra-emails
 * List all shared additional emails (Admins only)
 */
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const emails = await db.select().from(extraNotificationEmails);
        return NextResponse.json(emails);
    } catch (error) {
        console.error("Error fetching extra emails:", error);
        return NextResponse.json({
            error: "Failed to fetch extra emails",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * POST /api/notifications/extra-emails
 * Add a new shared email recipient (Admins only)
 */
export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        // Check if already exists
        const existing = await db.select().from(extraNotificationEmails).where(eq(extraNotificationEmails.email, email.toLowerCase()));
        if (existing.length > 0) {
            return NextResponse.json({ error: "Email already exists in the list" }, { status: 400 });
        }

        const newEmail = await db.insert(extraNotificationEmails).values({
            id: crypto.randomUUID(),
            email: email.toLowerCase(),
        }).returning();

        return NextResponse.json(newEmail[0]);
    } catch (error) {
        console.error("Error adding extra email:", error);
        return NextResponse.json({
            error: "Failed to add extra email",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * DELETE /api/notifications/extra-emails
 * Remove a shared email recipient (Admins only)
 */
export async function DELETE(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing email ID" }, { status: 400 });
        }

        await db.delete(extraNotificationEmails).where(eq(extraNotificationEmails.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting extra email:", error);
        return NextResponse.json({
            error: "Failed to delete extra email",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
