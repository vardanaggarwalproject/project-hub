import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { appNotifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET: Fetch notification history for the current user
 * POST: Mark a notification as read (or mark all as read)
 */

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

    try {
        const notifications = await db.select().from(appNotifications)
            .where(eq(appNotifications.userId, userId))
            .orderBy(desc(appNotifications.createdAt))
            .limit(limit);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("[API Notifications GET] Detailed error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { notificationId, markAll } = await req.json();

    try {
        if (markAll) {
            await db
                .update(appNotifications)
                .set({ isRead: true })
                .where(and(eq(appNotifications.userId, userId), eq(appNotifications.isRead, false)));

            return NextResponse.json({ success: true, message: "All notifications marked as read" });
        }

        if (notificationId) {
            await db
                .update(appNotifications)
                .set({ isRead: true })
                .where(and(eq(appNotifications.id, notificationId), eq(appNotifications.userId, userId)));

            return NextResponse.json({ success: true, message: "Notification marked as read" });
        }

        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    } catch (error) {
        console.error("[API Notifications POST] Detailed error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
