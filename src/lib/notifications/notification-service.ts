
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { user, appNotifications, notificationPreferences, pushSubscriptions } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getNotificationTemplate } from './templates';

/**
 * Unified Notification System
 * Consolidates Email, Slack, Push, and Socket notifications.
 */

export interface NotificationTarget {
    userId: string;
    userName?: string;
    email?: string;
    role?: string;
    preferences?: {
        email: boolean;
        slack: boolean;
        push: boolean;
        eodNotifications: boolean;
        memoNotifications: boolean;
        projectNotifications: boolean;
    };
}

export type NotificationType =
    | 'eod_submitted'
    | 'memo_submitted'
    | 'project_assigned'
    | 'project_created'
    | 'test_notification';

export interface NotificationPayload {
    type: NotificationType;
    title: string;
    body: string;
    url?: string;
    data?: Record<string, any>;
}

export interface EodNotificationData {
    userName: string;
    projectName: string;
    userId: string;
    content: string;
    clientContent?: string;
}

class NotificationService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        // VAPID configuration moved to sendPush method
    }

    private getTransporter() {
        if (this.transporter) return this.transporter;

        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpUser || !smtpPass) {
            console.warn('[NotificationService] SMTP_USER or SMTP_PASS missing. Email notifications disabled.');
            return null;
        }

        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = parseInt(process.env.SMTP_PORT || '587');
        const secure = process.env.SMTP_SECURE === 'true';

        console.log(`[NotificationService] Initializing transporter: ${host}:${port} (secure: ${secure})`);

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        return this.transporter;
    }

    async notify(targets: NotificationTarget[], payload: NotificationPayload) {
        if (targets.length === 0) return;

        const { html, slackBlocks } = getNotificationTemplate(payload.type, {
            ...payload.data,
            title: payload.title,
            body: payload.body
        });

        // 1. Save to DB
        try {
            await db.insert(appNotifications).values(targets.map(t => ({
                id: crypto.randomUUID(),
                userId: t.userId,
                type: payload.type,
                title: payload.title,
                body: payload.body,
                url: payload.url,
                data: payload.data,
            })));
        } catch (e) {
        }

        // 2. Process Channels
        await Promise.allSettled([
            this.sendEmail(targets, payload.type, payload.title, payload.body, html),
            this.sendSlack(targets, payload.type, slackBlocks),
            this.sendPush(targets, payload.type, payload),
            this.sendSocket(targets, payload)
        ]);
    }

    private async sendEmail(targets: NotificationTarget[], type: NotificationType, title: string, body: string, html: string) {
        const transporter = this.getTransporter();
        if (!transporter) {
            return;
        }

        // Fetch explicit recipients from DB
        let recipients: string[] = [];
        try {
            const { notificationRecipients } = await import('@/lib/db/schema');
            const data = await db.select().from(notificationRecipients);

            recipients = data
                .filter(r => {
                    if (type === 'eod_submitted' && !r.eodEnabled) return false;
                    if (type === 'memo_submitted' && !r.memoEnabled) return false;
                    if (type === 'project_created' && !r.projectEnabled) return false;
                    return true;
                })
                .map(r => r.email);

            console.log(`[NotificationService] Found ${recipients.length} eligible email recipients from managed list`);
        } catch (e) {
            console.error('[NotificationService] Error fetching recipients:', e);
        }

        if (recipients.length === 0) {
            console.log('[NotificationService] No recipients found for this notification type. Skipping email.');
            return;
        }

        const fromEmail = process.env.SMTP_USER;

        try {
            console.log(`[NotificationService] Sending email to: ${recipients.join(', ')}`);
            await transporter.sendMail({
                from: `"Project Hub" <${fromEmail}>`,
                to: recipients.join(', '),
                subject: title,
                text: body,
                html
            });
            console.log('[NotificationService] Email sent successfully');
        } catch (e: any) {
            console.error('[NotificationService] SMTP Error:', e);
        }
    }

    private async sendSlack(targets: NotificationTarget[], type: NotificationType, blocks: any[]) {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) return;

        const hasEligibleTargets = targets.some(t => {
            if (t.preferences?.slack === false) return false;
            if (type === 'eod_submitted' && t.preferences?.eodNotifications === false) return false;
            if (type === 'memo_submitted' && t.preferences?.memoNotifications === false) return false;
            if (type === 'project_created' && t.preferences?.projectNotifications === false) return false;
            return true;
        });

        if (!hasEligibleTargets) return;

        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks })
            });
        } catch (e) {
        }
    }

    private async sendPush(targets: NotificationTarget[], type: NotificationType, payload: NotificationPayload) {
        if (!process.env.VAPID_PUBLIC_KEY) {
            return;
        }

        const userIds = targets.filter(t => {
            if (t.preferences?.push === false) return false;
            if (type === 'eod_submitted' && t.preferences?.eodNotifications === false) return false;
            if (type === 'memo_submitted' && t.preferences?.memoNotifications === false) return false;
            if (type === 'project_created' && t.preferences?.projectNotifications === false) return false;
            return true;
        }).map(t => t.userId);

        if (userIds.length === 0) return;

        // Dynamically import web-push only when needed (server-side only)
        const webPush = (await import('web-push')).default;

        // Configure VAPID details
        if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            webPush.setVapidDetails(
                process.env.VAPID_SUBJECT || 'mailto:vardan.netweb@gmail.com',
                process.env.VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY
            );
        }

        const subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds));
        if (subs.length === 0) return;

        await Promise.all(subs.map(async sub => {
            try {
                await webPush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, JSON.stringify(payload));
            } catch (e: any) {
                if (e.statusCode === 410 || e.statusCode === 403) {
                    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
                }
            }
        }));
    }

    private async sendSocket(targets: NotificationTarget[], payload: NotificationPayload) {
        const io = (global as any).io;
        if (!io) return;
        targets.forEach(t => {
            io.to(`user:${t.userId}`).emit('notification', { ...payload, receivedAt: new Date().toISOString() });
        });
    }

    // Helper methods
    async getAdminTargets(): Promise<NotificationTarget[]> {
        const admins = await db.select({
            userId: user.id,
            userName: user.name,
            email: user.email,
            role: user.role,
            prefs: notificationPreferences,
        }).from(user).leftJoin(notificationPreferences, eq(user.id, notificationPreferences.userId)).where(eq(user.role, 'admin'));

        return admins.map(a => ({
            userId: a.userId,
            userName: a.userName,
            email: a.email,
            role: a.role ?? undefined,
            preferences: {
                email: a.prefs?.emailEnabled ?? true,
                slack: a.prefs?.slackEnabled ?? true,
                push: a.prefs?.pushEnabled ?? true,
                eodNotifications: a.prefs?.eodNotifications ?? true,
                memoNotifications: a.prefs?.memoNotifications ?? true,
                projectNotifications: a.prefs?.projectNotifications ?? true,
            }
        }));
    }

    async notifyEodSubmitted(data: EodNotificationData) {
        const targets = await this.getAdminTargets();
        await this.notify(targets, {
            type: 'eod_submitted',
            title: '📋 EOD Report Submitted',
            body: `${data.userName} submitted EOD for **${data.projectName}**`,
            url: '/admin/eods',
            data
        });
    }

    async notifyMemoSubmitted(data: { userName: string, projectName: string, userId: string, memoType: string, content: string }) {
        const targets = await this.getAdminTargets();
        await this.notify(targets, {
            type: 'memo_submitted',
            title: '📝 Memo Submitted',
            body: `${data.userName} submitted memo for **${data.projectName}**`,
            url: '/admin/memos',
            data
        });
    }

    async notifyProjectAssigned(data: { userName: string, projectName: string, userId: string, projectId: string }) {
        // Get the specific user target
        const userTarget = await db.select({
            userId: user.id,
            userName: user.name,
            email: user.email,
            role: user.role,
            prefs: notificationPreferences,
        })
            .from(user)
            .leftJoin(notificationPreferences, eq(user.id, notificationPreferences.userId))
            .where(eq(user.id, data.userId))
            .limit(1);

        if (userTarget.length === 0) return;

        const target = userTarget[0];
        await this.notify([{
            userId: target.userId,
            userName: target.userName,
            email: target.email,
            role: target.role ?? undefined,
            preferences: {
                email: target.prefs?.emailEnabled ?? true,
                slack: target.prefs?.slackEnabled ?? true,
                push: target.prefs?.pushEnabled ?? true,
                eodNotifications: target.prefs?.eodNotifications ?? true,
                memoNotifications: target.prefs?.memoNotifications ?? true,
                projectNotifications: target.prefs?.projectNotifications ?? true,
            }
        }], {
            type: 'project_assigned',
            title: '🎯 New Project Assignment',
            body: `You've been assigned to **${data.projectName}**`,
            url: `/projects/${data.projectId}`,
            data
        });
    }
}

export const notificationService = new NotificationService();
