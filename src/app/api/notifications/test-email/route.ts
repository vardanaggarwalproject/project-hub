import { auth } from "@/lib/auth";
import { notificationService } from "@/lib/notifications";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // We use a mock target and notification for the test
        await notificationService.notify([{
            userId: session.user.id,
            userName: session.user.name,
            email: email, // Use the provided test email
            preferences: {
                email: true,
                slack: false,
                push: false,
                eodNotifications: true,
                memoNotifications: true,
                projectNotifications: true
            }
        }], {
            type: 'test_notification',
            title: 'Test Notification',
            body: 'This is a test notification to verify email settings.',
            data: {
                userName: session.user.name,
                message: 'If you are seeing this, email notifications are working correctly.'
            }
        });

        return NextResponse.json({ success: true, message: "Test email triggered. Check server logs." });
    } catch (error) {
        console.error("Test email error:", error);
        return NextResponse.json({
            error: "Failed to send test email",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
