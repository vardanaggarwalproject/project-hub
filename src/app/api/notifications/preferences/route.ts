import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * GET /api/notifications/preferences
 * Get current user's notification preferences
 */
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const prefs = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, userId),
        });

        if (!prefs) {
            // Return defaults if no record exists
            return NextResponse.json({
                emailEnabled: true,
                slackEnabled: true,
                pushEnabled: true,
            });
        }

        return NextResponse.json(prefs);
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return NextResponse.json({
            error: "Failed to fetch preferences",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * PATCH /api/notifications/preferences
 * Update current user's notification preferences
 */
export async function PATCH(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();

        // Validate allowed fields
        // Regular users can only update pushEnabled
        // Admins can update all
        const isAdmin = session.user.role === "admin";

        const updateData: any = {};

        if (typeof body.pushEnabled === 'boolean') updateData.pushEnabled = body.pushEnabled;

        if (isAdmin) {
            if (typeof body.emailEnabled === 'boolean') updateData.emailEnabled = body.emailEnabled;
            if (typeof body.slackEnabled === 'boolean') updateData.slackEnabled = body.slackEnabled;
            if (typeof body.eodNotifications === 'boolean') updateData.eodNotifications = body.eodNotifications;
            if (typeof body.memoNotifications === 'boolean') updateData.memoNotifications = body.memoNotifications;
            if (typeof body.projectNotifications === 'boolean') updateData.projectNotifications = body.projectNotifications;
        }

        // Check if record exists
        const existing = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, userId),
        });

        if (existing) {
            const updated = await db.update(notificationPreferences)
                .set({
                    ...updateData,
                    updatedAt: new Date(),
                })
                .where(eq(notificationPreferences.userId, userId))
                .returning();
            return NextResponse.json(updated[0]);
        } else {
            // Create new record with defaults + updates
            const newPrefs = await db.insert(notificationPreferences).values({
                id: crypto.randomUUID(),
                userId,
                pushEnabled: true,
                emailEnabled: true,
                slackEnabled: true,
                ...updateData,
            }).returning();
            return NextResponse.json(newPrefs[0]);
        }

    } catch (error) {
        console.error("Error updating preferences:", error);
        return NextResponse.json({
            error: "Failed to update preferences",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
