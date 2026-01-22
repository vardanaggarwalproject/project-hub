import { auth } from "@/lib/auth";
import { notificationService } from "@/lib/notifications/notification-service";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userTarget = {
            userId: session.user.id,
            userName: session.user.name,
            email: session.user.email,
            role: session.user.role || undefined,
        };

        console.log(`[Test Notification] Sending to user: ${session.user.id}`);

        await notificationService.notify([userTarget], {
            type: "test_notification",
            title: "🔔 Notification System Check",
            body: "Your notification system is working correctly! You'll now receive updates for EODs and Memos.",
            url: "/user/settings",
            data: {
                test: true,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Test Notification API] Error:", error);
        return NextResponse.json(
            { error: "Failed to send test notification" },
            { status: 500 }
        );
    }
}
