
import { NotificationChannel, NotificationPayload, NotificationTarget } from '../types';
import { getNotificationTemplate } from '../templates';

export const slackChannel: NotificationChannel = {
    name: 'slack',

    async send(targets: NotificationTarget[], payload: NotificationPayload): Promise<void> {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) return;

        // Filter targets who have Slack enabled
        const validTargets = targets.filter(t => t.preferences?.slack !== false);
        if (validTargets.length === 0) return;

        try {
            const template = getNotificationTemplate(payload.type, {
                ...payload.data,
                title: payload.title,
                body: payload.body
            });

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blocks: template.slackBlocks
                }),
            });

        } catch (error) {
        }
    },
};
