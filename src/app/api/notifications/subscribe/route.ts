/**
 * Push Notification Subscription API
 * 
 * POST - Subscribe a browser to push notifications
 * DELETE - Unsubscribe a browser from push notifications
 */

import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * Subscribe to push notifications
 * Called when user enables notifications in settings
 */
export async function POST(req: Request) {
    try {
        const { subscription, userId } = await req.json();

        if (!subscription || !userId) {
            return NextResponse.json(
                { error: 'Missing subscription or userId' },
                { status: 400 }
            );
        }

        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            return NextResponse.json(
                { error: 'Invalid subscription object' },
                { status: 400 }
            );
        }

        // Check if subscription with this endpoint already exists
        const existing = await db
            .select()
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

        if (existing.length > 0) {
            // Update existing subscription (user may have changed)
            await db
                .update(pushSubscriptions)
                .set({
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                    userId,
                })
                .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

        } else {
            // Create new subscription
            await db.insert(pushSubscriptions).values({
                id: crypto.randomUUID(),
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            });

        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to subscribe' },
            { status: 500 }
        );
    }
}

/**
 * Unsubscribe from push notifications
 * Called when user disables notifications or clears browser data
 */
export async function DELETE(req: Request) {
    try {
        const { endpoint } = await req.json();

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Missing endpoint' },
                { status: 400 }
            );
        }

        await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, endpoint));


        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to unsubscribe' },
            { status: 500 }
        );
    }
}
