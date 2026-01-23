/**
 * Notification System Type Definitions
 * 
 * This file defines the core types used throughout the notification system.
 * Using TypeScript interfaces allows for type-safe channel implementations.
 */

// Types of notifications the system can send
export type NotificationType =
    | 'eod_submitted'      // User submitted an EOD report
    | 'memo_submitted'     // User submitted a memo
    | 'project_assigned'   // User was assigned to a project
    | 'project_created'    // New project was created
    | 'test_notification'; // System check notification


// The data structure for a notification
export interface NotificationPayload {
    type: NotificationType;
    title: string;
    body: string;
    url?: string;                    // URL to navigate to when clicked
    data?: Record<string, unknown>;  // Additional metadata
}

// A target user who should receive the notification
export interface NotificationTarget {
    userId: string;
    userName?: string;
    email?: string;
    role?: string;
    preferences?: {
        email: boolean;
        slack: boolean;
        push: boolean;
    };
}

// Interface for notification channels (Strategy Pattern)
// Each channel (push, slack, socket) implements this interface
export interface NotificationChannel {
    name: string;
    send(targets: NotificationTarget[], payload: NotificationPayload): Promise<void>;
}
