/**
 * Push Notification Subscription Hook
 * 
 * This hook manages browser push notification subscriptions.
 * Use it in the settings page or any component where users enable notifications.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePushNotificationsOptions {
    userId: string;
}

interface UsePushNotificationsReturn {
    isSupported: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    permission: NotificationPermission | 'default';
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications({ userId }: UsePushNotificationsOptions): UsePushNotificationsReturn {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    // 1. Check support & initial permission
    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
        }
    }, []);

    // 2. Listen for permission changes in real-time
    useEffect(() => {
        if (!isSupported) return;

        // Modern browsers support navigator.permissions
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'notifications' }).then((status) => {
                const mapPermission = (state: PermissionState): NotificationPermission =>
                    state === 'prompt' ? 'default' : state;

                // Set initial
                setPermission(mapPermission(status.state));

                // Listen for changes
                status.onchange = () => {
                    setPermission(mapPermission(status.state));
                };
            });
        }
    }, [isSupported]);

    // 3. Check subscription status (only if granted/supported)
    useEffect(() => {
        async function checkSubscription() {
            if (!isSupported) {
                setIsLoading(false);
                return;
            }

            try {
                // If denied, we can't be subscribed in a meaningful way for Push (though SW might exist)
                if (permission === 'denied') {
                    setIsSubscribed(false);
                    return;
                }

                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        }

        checkSubscription();
    }, [isSupported, permission]); // Re-check if permission changes

    // Subscribe
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            return false;
        }

        setIsLoading(true);

        try {
            // 1. Check Permissions
            let currentPermission = Notification.permission;

            if (currentPermission !== 'granted') {
                currentPermission = await Notification.requestPermission();
                setPermission(currentPermission);
            }

            if (currentPermission !== 'granted') {
                return false;
            }

            // 2. VAPID Key Check
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                console.error('VAPID public key not found');
                return false;
            }

            // 3. Service Worker Registration
            // Register if not already registered, otherwise get the active one
            let registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                registration = await navigator.serviceWorker.register('/sw.js');
            }

            // Wait for it to be ready
            registration = await navigator.serviceWorker.ready;

            if (!registration.pushManager) {
                console.error('PushManager not supported on this registration');
                return false;
            }

            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

            // 4. Subscribe with Push Manager
            // Check for existing subscription
            let subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Check if keys match or if we need to refresh
                // For simplicity and reliability, we'll use the existing one if it exists
                // and just ensure the server has it.
            } else {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
                });
            }

            // 5. Send to Server
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userId,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server sync failed: ${response.status} ${errorText}`);
            }

            setIsSubscribed(true);
            return true;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, userId]);

    // Unsubscribe
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;
        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Tell server
                await fetch('/api/notifications/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
            }

            setIsSubscribed(false);
            return true;
        } catch (error) {
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        permission,
        subscribe,
        unsubscribe,
    };
}

/**
 * Convert base64 VAPID public key to Uint8Array
 * Required by the Push API
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    // Sanitize input: remove all whitespace/newlines
    const cleanBase64 = base64String.replace(/\s/g, '');
    const padding = '='.repeat((4 - (cleanBase64.length % 4)) % 4);
    const base64 = (cleanBase64 + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
