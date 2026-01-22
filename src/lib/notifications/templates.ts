
/**
 * Unified Notification Templates
 * 
 * This file provides a single source of truth for all notification content used 
 * across different channels (Email, Slack, Push).
 */

export interface NotificationContent {
    subject: string;
    title: string;
    body: string;
    html: string;
    slackBlocks: any[];
}

const createEmailWrapper = (content: string, title: string, accentColor: string = '#2563eb'): string => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background: ${accentColor}; padding: 30px; text-align: center; color: white; }
                .content { padding: 40px; color: #333; line-height: 1.6; }
                .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; }
                .button { display: inline-block; background: ${accentColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
                .info-box { background: #f0f7ff; border-left: 4px solid ${accentColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">${title}</h1>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    &copy; 2026 Project Hub. All rights reserved.
                </div>
            </div>
        </body>
        </html>
    `;
};

export const getNotificationTemplate = (type: string, data: any): NotificationContent => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    switch (type) {
        case 'eod_submitted': {
            const dashboardUrl = `${appUrl}/admin/eods`;
            const accentColor = '#2563eb';
            const title = '📋 EOD Report Submitted';
            const body = `${data.userName} submitted EOD for **${data.projectName}**`;

            return {
                subject: `📋 EOD Submitted - ${data.projectName}`,
                title,
                body,
                html: createEmailWrapper(`
                    <p style="font-size: 16px;">Hello Admin,</p>
                    <p>${data.userName} has submitted a new EOD report for the project <strong>${data.projectName}</strong>.</p>
                    <div class="info-box">
                        <strong>Project:</strong> ${data.projectName}<br/>
                        <strong>Submitted by:</strong> ${data.userName}
                    </div>
                    ${data.content ? `<div style="background-color: #fafafa; padding: 15px; border-radius: 4px; border: 1px solid #eee; white-space: pre-wrap;">${data.content}</div>` : ''}
                    <div style="text-align: center;">
                        <a href="${dashboardUrl}" class="button">View Full Report</a>
                    </div>
                `, title, accentColor),
                slackBlocks: [
                    { type: 'header', text: { type: 'plain_text', text: title, emoji: true } },
                    { type: 'section', text: { type: 'mrkdwn', text: body } },
                    ...(data.content ? [{ type: 'divider' }, { type: 'section', text: { type: 'mrkdwn', text: `*Content:*\n>>>${data.content}` } }] : []),
                    { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'View Report' }, url: dashboardUrl, style: 'primary' }] }
                ]
            };
        }

        case 'memo_submitted': {
            const dashboardUrl = `${appUrl}/admin/memos`;
            const accentColor = '#8b5cf6';
            const title = '📝 Memo Submitted';
            const typeLabel = data.memoType === 'universal' ? 'Universal' : '140-char';
            const body = `${data.userName} submitted a ${typeLabel} memo for **${data.projectName}**`;

            return {
                subject: `📝 Memo Submitted - ${data.projectName}`,
                title,
                body,
                html: createEmailWrapper(`
                    <p style="font-size: 16px;">Hello Admin,</p>
                    <p>${data.userName} has submitted a new ${typeLabel} memo for <strong>${data.projectName}</strong>.</p>
                    <div class="info-box">
                        <strong>Type:</strong> ${typeLabel}<br/>
                        <strong>Project:</strong> ${data.projectName}
                    </div>
                    ${data.content ? `<div style="background-color: #fafafa; padding: 15px; border-radius: 4px; border: 1px solid #eee; white-space: pre-wrap;">${data.content}</div>` : ''}
                    <div style="text-align: center;">
                        <a href="${dashboardUrl}" class="button">Review Memo</a>
                    </div>
                `, title, accentColor),
                slackBlocks: [
                    { type: 'header', text: { type: 'plain_text', text: title, emoji: true } },
                    { type: 'section', text: { type: 'mrkdwn', text: body } },
                    ...(data.content ? [{ type: 'divider' }, { type: 'section', text: { type: 'mrkdwn', text: `*Memo Content:*\n>>>${data.content}` } }] : []),
                    { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Review Memo' }, url: dashboardUrl, style: 'primary' }] }
                ]
            };
        }

        case 'project_assigned': {
            const dashboardUrl = `${appUrl}/user/projects`;
            const accentColor = '#10b981';
            const title = '🎉 New Project Assignment';
            const body = `You have been assigned to the project **${data.projectName}**`;

            return {
                subject: `🎯 Project Assignment - ${data.projectName}`,
                title,
                body,
                html: createEmailWrapper(`
                    <p style="font-size: 16px;">Hello,</p>
                    <p>You have been assigned to a new project: <strong>${data.projectName}</strong>.</p>
                    <p>You can now start collaborating with your team members on this project.</p>
                    <div style="text-align: center;">
                        <a href="${dashboardUrl}" class="button">Go to Project</a>
                    </div>
                `, title, accentColor),
                slackBlocks: [
                    { type: 'header', text: { type: 'plain_text', text: title, emoji: true } },
                    { type: 'section', text: { type: 'mrkdwn', text: body } },
                    { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Go to Project' }, url: dashboardUrl, style: 'primary' }] }
                ]
            };
        }

        default: {
            const accentColor = '#2563eb';
            return {
                subject: data.title || 'System Notification',
                title: data.title || 'Notification',
                body: data.body || '',
                html: createEmailWrapper(`<p>${data.body || ''}</p>`, data.title || 'Notification', accentColor),
                slackBlocks: [
                    { type: 'section', text: { type: 'mrkdwn', text: data.body || '' } }
                ]
            };
        }
    }
};
