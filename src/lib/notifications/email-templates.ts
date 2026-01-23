export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

const createEmailWrapper = (content: string, accentColor: string = '#2563eb'): string => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Project Management System</title>
            <style>
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
                * { box-sizing: border-box; }
            </style>
        </head>
        <body style="margin: 0; padding: 0;">
            ${content}
        </body>
        </html>
    `;
};

export const emailTemplates = {
    eodSubmitted: (data: {
        userName: string;
        projectName: string;
        content: string;
        dashboardUrl: string;
    }): EmailTemplate => ({
        subject: `📋 EOD Report Submitted - ${data.projectName}`,
        text: `${data.userName} submitted an EOD report for ${data.projectName}.\n\n${data.content}`,
        html: createEmailWrapper(`
            <div style="background-color: #f5f5f5; padding: 20px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- HEADER -->
                    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">📋 EOD Report Submitted</h1>
                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">New submission requires your review</p>
                    </div>

                    <!-- BODY -->
                    <div style="padding: 30px 20px;">
                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            Hello Admin,
                        </p>

                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            A new EOD (End of Day) report has been submitted and is waiting for your review.
                        </p>

                        <!-- INFO BOX -->
                        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 24px 0;">
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Submitted by:</strong></p>
                            <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">${data.userName}</p>
                            
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Project:</strong></p>
                            <p style="margin: 0; color: #374151; font-size: 14px;">${data.projectName}</p>
                        </div>

                        <!-- CONTENT -->
                        <h3 style="margin: 24px 0 12px 0; color: #1f2937; font-size: 15px; font-weight: 600;">Report Content:</h3>
                        <div style="background-color: #fafafa; padding: 16px; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap;">
${data.content}
                        </div>

                        <!-- CTA BUTTON -->
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background-color 0.2s; border: 0; cursor: pointer;">
                                View Full Report
                            </a>
                        </div>

                        <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            You received this email because you are an administrator in the Project Management System. EOD reports are submitted by team members to track their daily progress.
                        </p>
                    </div>

                    <!-- FOOTER -->
                    <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #374151; font-size: 13px; font-weight: 600;">
                            Project Management System
                        </p>
                        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
                            © 2026 All rights reserved.<br>
                            <a href="https://yourapp.com/preferences" style="color: #2563eb; text-decoration: none;">Manage Notification Preferences</a>
                        </p>
                    </div>
                </div>
            </div>
        `),
    }),

    memoSubmitted: (data: {
        userName: string;
        projectName: string;
        memoType: string;
        content: string;
        dashboardUrl: string;
    }): EmailTemplate => ({
        subject: `📝 Memo Submitted - ${data.projectName}`,
        text: `${data.userName} submitted a ${data.memoType} memo for ${data.projectName}.\n\n${data.content}`,
        html: createEmailWrapper(`
            <div style="background-color: #f5f5f5; padding: 20px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- HEADER -->
                    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">📝 Memo Submitted</h1>
                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">New memo awaiting your approval</p>
                    </div>

                    <!-- BODY -->
                    <div style="padding: 30px 20px;">
                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            Hello Admin,
                        </p>

                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            A new memo has been submitted and requires your review.
                        </p>

                        <!-- INFO BOX -->
                        <div style="background-color: #faf5ff; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 4px; margin: 24px 0;">
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Submitted by:</strong></p>
                            <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">${data.userName}</p>
                            
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Project:</strong></p>
                            <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">${data.projectName}</p>
                            
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Type:</strong></p>
                            <p style="margin: 0; color: #374151; font-size: 14px;">
                                ${data.memoType === 'universal' ? '📄 Universal Memo' : '📎 140-Character Memo'}
                            </p>
                        </div>

                        <!-- CONTENT -->
                        <h3 style="margin: 24px 0 12px 0; color: #1f2937; font-size: 15px; font-weight: 600;">Memo Content:</h3>
                        <div style="background-color: #fafafa; padding: 16px; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap;">
${data.content}
                        </div>

                        <!-- CTA BUTTON -->
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                Review Memo
                            </a>
                        </div>

                        <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            You received this email because you are an administrator. Please review and approve or reject this memo as needed.
                        </p>
                    </div>

                    <!-- FOOTER -->
                    <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #374151; font-size: 13px; font-weight: 600;">
                            Project Management System
                        </p>
                        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
                            © 2026 All rights reserved.<br>
                            <a href="https://yourapp.com/preferences" style="color: #8b5cf6; text-decoration: none;">Manage Notification Preferences</a>
                        </p>
                    </div>
                </div>
            </div>
        `),
    }),

    projectAssignment: (data: {
        userName: string;
        projectName: string;
        role: string;
        dashboardUrl: string;
    }): EmailTemplate => ({
        subject: `🎯 Project Assignment - ${data.projectName}`,
        text: `You have been assigned to the ${data.projectName} project as a ${data.role}.`,
        html: createEmailWrapper(`
            <div style="background-color: #f5f5f5; padding: 20px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- HEADER -->
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎯 Project Assignment</h1>
                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">You've been added to a new project</p>
                    </div>

                    <!-- BODY -->
                    <div style="padding: 30px 20px;">
                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            Hello ${data.userName},
                        </p>

                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            Great news! You have been assigned to a new project. You can now start accessing the project and collaborating with your team members.
                        </p>

                        <!-- INFO BOX -->
                        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 24px 0;">
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Project:</strong></p>
                            <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">${data.projectName}</p>
                            
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Your Role:</strong></p>
                            <p style="margin: 0; color: #374151; font-size: 14px;">${data.role}</p>
                        </div>

                        <!-- FEATURES -->
                        <h3 style="margin: 24px 0 12px 0; color: #1f2937; font-size: 15px; font-weight: 600;">What's Next:</h3>
                        <ul style="margin: 0; padding: 0 0 0 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                            <li>Review project details and objectives</li>
                            <li>Connect with your team members</li>
                            <li>Submit daily EOD reports</li>
                            <li>Participate in project discussions</li>
                        </ul>

                        <!-- CTA BUTTON -->
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                Go to Project
                            </a>
                        </div>

                        <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            If you have any questions about this assignment or the project, please contact your administrator.
                        </p>
                    </div>

                    <!-- FOOTER -->
                    <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #374151; font-size: 13px; font-weight: 600;">
                            Project Management System
                        </p>
                        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
                            © 2026 All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        `),
    }),

    taskNotification: (data: {
        userName: string;
        taskTitle: string;
        taskDescription: string;
        assignedTo: string;
        dueDate?: string;
        dashboardUrl: string;
    }): EmailTemplate => ({
        subject: `✅ New Task Assigned - ${data.taskTitle}`,
        text: `You have been assigned a new task: ${data.taskTitle}\n\n${data.taskDescription}`,
        html: createEmailWrapper(`
            <div style="background-color: #f5f5f5; padding: 20px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- HEADER -->
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✅ New Task Assigned</h1>
                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">You have a new task to complete</p>
                    </div>

                    <!-- BODY -->
                    <div style="padding: 30px 20px;">
                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            Hello ${data.assignedTo},
                        </p>

                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                            You have been assigned a new task that requires your attention.
                        </p>

                        <!-- INFO BOX -->
                        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 24px 0;">
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Task:</strong></p>
                            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; font-weight: 600;">${data.taskTitle}</p>
                            
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Assigned by:</strong></p>
                            <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">${data.userName}</p>
                            
                            ${data.dueDate ? `
                            <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;"><strong>Due Date:</strong></p>
                            <p style="margin: 0; color: #374151; font-size: 14px;">${data.dueDate}</p>
                            ` : ''}
                        </div>

                        <!-- DESCRIPTION -->
                        <h3 style="margin: 24px 0 12px 0; color: #1f2937; font-size: 15px; font-weight: 600;">Task Description:</h3>
                        <div style="background-color: #fafafa; padding: 16px; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap;">
${data.taskDescription}
                        </div>

                        <!-- CTA BUTTON -->
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                View Task
                            </a>
                        </div>

                        <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            Please review the task details and update the status as you progress.
                        </p>
                    </div>

                    <!-- FOOTER -->
                    <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #374151; font-size: 13px; font-weight: 600;">
                            Project Management System
                        </p>
                        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
                            © 2026 All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        `),
    }),
};
