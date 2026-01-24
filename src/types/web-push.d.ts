// Type declarations for web-push module
declare module 'web-push' {
    interface PushSubscription {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }

    interface VapidDetails {
        subject: string;
        publicKey: string;
        privateKey: string;
    }

    interface SendResult {
        statusCode: number;
        body: string;
        headers: Record<string, string>;
    }

    interface WebPushError extends Error {
        statusCode: number;
        headers: Record<string, string>;
        body: string;
        endpoint: string;
    }

    interface RequestOptions {
        gcmAPIKey?: string;
        vapidDetails?: VapidDetails;
        timeout?: number;
        TTL?: number;
        headers?: Record<string, string>;
        contentEncoding?: 'aes128gcm' | 'aesgcm';
        urgency?: 'very-low' | 'low' | 'normal' | 'high';
        topic?: string;
        proxy?: string;
        agent?: unknown;
    }

    function setVapidDetails(
        subject: string,
        publicKey: string,
        privateKey: string
    ): void;

    function setGCMAPIKey(apiKey: string): void;

    function generateVAPIDKeys(): { publicKey: string; privateKey: string };

    function sendNotification(
        subscription: PushSubscription,
        payload?: string | Buffer | null,
        options?: RequestOptions
    ): Promise<SendResult>;

    function generateRequestDetails(
        subscription: PushSubscription,
        payload?: string | Buffer | null,
        options?: RequestOptions
    ): {
        method: string;
        headers: Record<string, string>;
        body: Buffer | null;
        endpoint: string;
    };
}
