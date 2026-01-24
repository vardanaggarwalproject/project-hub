
import nodemailer from 'nodemailer';
import { NotificationChannel, NotificationPayload, NotificationTarget } from '../types';
import { getNotificationTemplate } from '../templates';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const emailChannel: NotificationChannel = {
    name: 'email',

    async send(targets: NotificationTarget[], payload: NotificationPayload): Promise<void> {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return;
        }

        const recipients = targets
            .filter((t) => t.preferences?.email !== false && !!t.email)
            .map((t) => t.email as string);

        if (recipients.length === 0) return;

        try {
            const template = getNotificationTemplate(payload.type, {
                ...payload.data,
                title: payload.title,
                body: payload.body
            });

            await transporter.sendMail({
                from: `"Project Hub" <${process.env.SMTP_USER}>`,
                to: recipients.join(', '),
                subject: template.subject,
                text: template.body,
                html: template.html,
            });

        } catch (error) {
        }
    },
};
