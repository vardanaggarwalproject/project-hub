import { db } from "@/lib/db";
import { notificationRecipients } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * GET /api/notifications/recipients
 * List all email recipients (Admins only)
 */
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const recipients = await db.select().from(notificationRecipients);
        return NextResponse.json(recipients);
    } catch (error) {
        console.error("Error fetching notification recipients:", error);
        return NextResponse.json({
            error: "Failed to fetch recipients",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * POST /api/notifications/recipients
 * Add a new recipient (Admins only)
 */
export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email, label } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        // Check if already exists
        const existing = await db.select().from(notificationRecipients).where(eq(notificationRecipients.email, email.toLowerCase()));
        if (existing.length > 0) {
            return NextResponse.json({ error: "Email already exists in the list" }, { status: 400 });
        }

        const newRecipient = await db.insert(notificationRecipients).values({
            id: crypto.randomUUID(),
            email: email.toLowerCase(),
            label: label || "External",
            eodEnabled: true,
            memoEnabled: true,
            projectEnabled: true,
        }).returning();

        return NextResponse.json(newRecipient[0]);
    } catch (error) {
        console.error("Error adding notification recipient:", error);
        return NextResponse.json({
            error: "Failed to add recipient",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * PATCH /api/notifications/recipients
 * Update recipient's toggles (Admins only)
 */
export async function PATCH(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing recipient ID" }, { status: 400 });
        }

        const updated = await db.update(notificationRecipients)
            .set(updates)
            .where(eq(notificationRecipients.id, id))
            .returning();

        return NextResponse.json(updated[0]);
    } catch (error) {
        console.error("Error updating notification recipient:", error);
        return NextResponse.json({
            error: "Failed to update recipient",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * DELETE /api/notifications/recipients
 * Remove a recipient (Admins only)
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
            return NextResponse.json({ error: "Missing recipient ID" }, { status: 400 });
        }

        await db.delete(notificationRecipients).where(eq(notificationRecipients.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting notification recipient:", error);
        return NextResponse.json({
            error: "Failed to delete recipient",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
