/**
 * Notification System - Public API
 * 
 * This barrel file exports all public interfaces for the notification system.
 * Import from '@/lib/notifications' in your code.
 */

export { notificationService } from './notification-service';
export type { NotificationType, NotificationPayload, NotificationTarget, NotificationChannel } from './types';
