/**
 * Push Notification Channel
 * 
 * Sends browser push notifications using the Web Push protocol.
 * Uses VAPID (Voluntary Application Server Identification) keys for authentication.
 */

import webPush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { NotificationChannel, NotificationPayload, NotificationTarget } from '../types';

// Configure web-push with VAPID details
// These keys authenticate your server with push services (FCM, Mozilla, etc.)
webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export const pushChannel: NotificationChannel = {
    name: 'push',

    async send(targets: NotificationTarget[], payload: NotificationPayload): Promise<void> {
        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            return;
        }

        // Get user IDs from targets who have push enabled
        const userIds = targets
            .filter(t => t.preferences?.push !== false)
            .map(t => t.userId);
        if (userIds.length === 0) {
            return;
        }

        // Fetch all push subscriptions for these users
        const subscriptions = await db
            .select()
            .from(pushSubscriptions)
            .where(inArray(pushSubscriptions.userId, userIds));

        if (subscriptions.length === 0) {
            return;
        }

        // Send to all subscriptions in parallel
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webPush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        JSON.stringify(payload)
                    );
                } catch (error: unknown) {
                    // Handle expired subscriptions (HTTP 410 Gone)
                    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
                        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
                    }
                    throw error;
                }
            })
        );

        const successful = results.filter((r) => r.status === 'fulfilled').length;
    },
};
