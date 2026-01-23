import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all subscriptions for this user
        const subs = await db.select()
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.userId, session.user.id));

        return NextResponse.json({
            userId: session.user.id,
            subscriptionCount: subs.length,
            subscriptions: subs.map(s => ({
                id: s.id,
                endpoint: s.endpoint.substring(0, 50) + '...',
                createdAt: s.createdAt
            })),
            vapidConfigured: !!process.env.VAPID_PUBLIC_KEY
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to get subscription status" },
            { status: 500 }
        );
    }
}
