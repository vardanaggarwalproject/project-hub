
/**
 * Unified Notification Templates
 * 
 * Simplified format: "Project Name (Developer Name) - Update Type"
 * This makes it immediately clear what the notification is about.
 */

export interface NotificationContent {
    subject: string;
    title: string;
    body: string;
    html: string;
    slackBlocks: any[];
}

/**
 * Formats multi-line content with bullet points for better readability
 */
const formatContentWithBullets = (content: string): string => {
    if (!content) return 'No content provided';

    // Split by newlines and filter empty lines
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // If single line, return as is
    if (lines.length === 1) return content;

    // Format with bullet points
    return lines.map((line, index) => `• ${line}`).join('\n');
};

/**
 * Formats content for Slack (uses markdown bullet points)
 */
const formatContentForSlack = (content: string): string => {
    if (!content) return 'No content provided';

    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 1) return content;

    return lines.map(line => `• ${line}`).join('\n');
};

const createEmailWrapper = (content: string, title: string, accentColor: string = '#2563eb'): string => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                    background-color: #f4f4f4; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 20px auto; 
                    background: #ffffff; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12); 
                }
                .header { 
                    background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); 
                    padding: 30px; 
                    text-align: center; 
                    color: white; 
                }
                .content { 
                    padding: 40px; 
                    color: #333; 
                    line-height: 1.6; 
                }
                .footer { 
                    background: #f9f9f9; 
                    padding: 20px; 
                    text-align: center; 
                    color: #999; 
                    font-size: 12px; 
                }
                .button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%);
                    color: white !important; 
                    padding: 14px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: 600; 
                    margin-top: 24px; 
                    box-shadow: 0 4px 12px ${accentColor}40;
                    transition: all 0.3s ease;
                    letter-spacing: 0.3px;
                }
                .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px ${accentColor}60;
                }
                .update-section { 
                    background-color: #fafafa; 
                    padding: 18px; 
                    border-radius: 8px; 
                    border-left: 4px solid ${accentColor}; 
                    margin: 12px 0; 
                }
                .update-label { 
                    font-weight: 700; 
                    color: #555; 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    margin-bottom: 10px; 
                    letter-spacing: 0.5px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${title}</h1>
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


            // Simplified format: "Project Name (Developer Name) - EOD Report"
            const title = `${data.projectName} (${data.userName}) - EOD Report`;


            // Format internal and client updates with labels
            const internalUpdate = formatContentWithBullets(data.content || 'No content provided');
            const clientUpdate = data.clientContent ? formatContentWithBullets(data.clientContent) : null;

            // For Slack
            const internalSlack = formatContentForSlack(data.content || 'No content provided');
            const clientSlack = data.clientContent ? formatContentForSlack(data.clientContent) : null;

            // Build body for push/in-app notifications
            let body = `Internal Update:\n${internalUpdate}`;
            if (clientUpdate) {
                body += `\n\nClient Update:\n${clientUpdate}`;
            }

            return {
                subject: `${data.projectName} (${data.userName}) - EOD Report`,
                title,
                body,
                html: createEmailWrapper(`
                    <p style="font-size: 16px; font-weight: bold;">${data.projectName} (${data.userName}) - EOD Report</p>
                    
                    <div class="update-section">
                        <div class="update-label">Internal Update</div>
                        <div style="white-space: pre-wrap;">${internalUpdate}</div>
                    </div>
                    
                    ${clientUpdate ? `
                    <div class="update-section">
                        <div class="update-label">Client Update</div>
                        <div style="white-space: pre-wrap;">${clientUpdate}</div>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center;">
                        <a href="${dashboardUrl}" class="button">View All EODs</a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
                `, title, accentColor),
                slackBlocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*${data.projectName} (${data.userName}) - EOD Report*`
                        }
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Internal Update:*\n${internalSlack}`
                        }
                    },
                    ...(clientSlack ? [{
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Client Update:*\n${clientSlack}`
                        }
                    }] : []),
                    {
                        type: 'actions',
                        elements: [{
                            type: 'button',
                            text: { type: 'plain_text', text: 'View All EODs' },
                            url: dashboardUrl,
                            style: 'primary'
                        }]
                    }
                ]
            };
        }

        case 'memo_submitted': {
            const dashboardUrl = `${appUrl}/admin/memos`;
            const accentColor = '#8b5cf6';


            // Simplified format: "Project Name (Developer Name) - Memo"
            const title = `${data.projectName} (${data.userName}) - Memo`;


            // Format universal and short memo with labels
            const universalMemo = formatContentWithBullets(data.content || 'No content provided');
            const shortMemo = data.shortContent ? formatContentWithBullets(data.shortContent) : null;

            // For Slack
            const universalSlack = formatContentForSlack(data.content || 'No content provided');
            const shortSlack = data.shortContent ? formatContentForSlack(data.shortContent) : null;

            // Build body for push/in-app notifications
            let body = `Universal Memo:\n${universalMemo}`;
            if (shortMemo) {
                body += `\n\n140-char Memo:\n${shortMemo}`;
            }

            return {
                subject: `${data.projectName} (${data.userName}) - Memo`,
                title,
                body,
                html: createEmailWrapper(`
                    <p style="font-size: 16px; font-weight: bold;">${data.projectName} (${data.userName}) - Memo</p>
                    
                    <div class="update-section">
                        <div class="update-label">Universal Memo</div>
                        <div style="white-space: pre-wrap;">${universalMemo}</div>
                    </div>
                    
                    ${shortMemo ? `
                    <div class="update-section">
                        <div class="update-label">140-char Memo</div>
                        <div style="white-space: pre-wrap;">${shortMemo}</div>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center;">
                        <a href="${dashboardUrl}" class="button">View All Memos</a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
                `, title, accentColor),
                slackBlocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*${data.projectName} (${data.userName}) - Memo*`
                        }
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Universal Memo:*\n${universalSlack}`
                        }
                    },
                    ...(shortSlack ? [{
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*140-char Memo:*\n${shortSlack}`
                        }
                    }] : []),
                    {
                        type: 'actions',
                        elements: [{
                            type: 'button',
                            text: { type: 'plain_text', text: 'View All Memos' },
                            url: dashboardUrl,
                            style: 'primary'
                        }]
                    }
                ]
            };
        }

        case 'project_assigned': {
            const dashboardUrl = `${appUrl}/user/projects`;
            const accentColor = '#10b981';

            // Simplified format: "Project Name - New Assignment"
            const title = `${data.projectName} - New Assignment`;
            const body = `You have been assigned to ${data.projectName}`;

            return {
                subject: `${data.projectName} - New Assignment`,
                title,
                body,
                html: createEmailWrapper(`
                    <p style="font-size: 16px; font-weight: bold;">${data.projectName} - New Assignment</p>
                    <p>You have been assigned to work on this project. You can now start collaborating with your team.</p>
                    <div style="text-align: center;">
                        <a href="${dashboardUrl}" class="button">View Project</a>
                    </div>
                `, title, accentColor),
                slackBlocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*${data.projectName} - New Assignment*\n\nYou have been assigned to this project.`
                        }
                    },
                    {
                        type: 'actions',
                        elements: [{
                            type: 'button',
                            text: { type: 'plain_text', text: 'View Project' },
                            url: dashboardUrl,
                            style: 'primary'
                        }]
                    }
                ]
            };
        }

        default: {
            // Fallback for any other notification types
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
