# Notification System

> **Last Updated:** 2026-02-02
> **Channels:** Email, Push, In-App, Slack
> **Architecture:** Multi-channel service

---

## Table of Contents

1. [Overview](#overview)
2. [Notification Channels](#notification-channels)
3. [Service Architecture](#service-architecture)
4. [Email Notifications](#email-notifications)
5. [Push Notifications](#push-notifications)
6. [In-App Notifications](#in-app-notifications)
7. [Slack Integration](#slack-integration)
8. [User Preferences](#user-preferences)
9. [Event Types](#event-types)

---

## Overview

Project Hub features a **comprehensive multi-channel notification system** that delivers real-time updates through multiple mediums.

### Key Features

- ✅ **4 notification channels** - Email, Push, In-App, Slack
- ✅ **User preferences** - Per-user channel control
- ✅ **Event-based** - Triggered by system events
- ✅ **Non-blocking** - Fire-and-forget with timeout
- ✅ **Admin recipients** - Configurable admin email list
- ✅ **Real-time delivery** - Socket.IO for in-app notifications

---

## Notification Channels

### Channel Overview

| Channel | Use Case | Delivery Time | User Control |
|---------|----------|---------------|--------------|
| **Email** | Important updates, summaries | ~5 seconds | ✅ Yes |
| **Push** | Instant alerts, chat messages | Real-time | ✅ Yes |
| **In-App** | Activity feed, system alerts | Real-time | ✅ Yes |
| **Slack** | Team notifications, admin alerts | Real-time | ✅ Yes |

### Channel Priority

When multiple channels are enabled:

1. **In-App** - Always delivered first (instant)
2. **Push** - Second (requires browser permission)
3. **Email** - Third (reliable fallback)
4. **Slack** - Parallel with email (admin only)

---

## Service Architecture

### Centralized Notification Service

Location: `src/lib/notifications/service.ts`

```typescript
interface NotificationParams {
  event: NotificationEvent;
  data: Record<string, any>;
  recipients?: string[];  // Admin emails
  userId?: string;        // User to notify
}

export async function sendNotification(params: NotificationParams) {
  const { event, data, recipients, userId } = params;

  // Get user preferences
  const preferences = await getUserPreferences(userId);

  // Fire all enabled channels in parallel
  const results = await Promise.allSettled([
    preferences.emailEnabled && sendEmail(event, data, recipients),
    preferences.pushEnabled && sendPush(userId, event, data),
    preferences.inAppEnabled && sendInApp(userId, event, data),
    preferences.slackEnabled && sendSlack(event, data),
  ]);

  // Log results
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Notification channel ${index} failed:`, result.reason);
    }
  });
}
```

### Non-Blocking Execution

```typescript
// Fire and forget (don't await)
sendNotification({
  event: 'eod_submitted',
  data: { userId, projectId, reportDate },
}).catch((error) => {
  console.error('Notification failed:', error);
});

// Continue execution immediately
return NextResponse.json({ success: true });
```

### Timeout Protection

```typescript
async function sendWithTimeout<T>(
  promise: Promise<T>,
  timeout: number = 3000
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeout);
  });

  return Promise.race([promise, timeoutPromise]);
}
```

---

## Email Notifications

### Email Configuration

Uses **Nodemailer** with Gmail SMTP.

#### Environment Variables

```bash
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Setup Gmail App Password

1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords
4. Generate password for "Mail"
5. Copy to `SMTP_PASS` in `.env`

### Email Service Implementation

```typescript
// src/lib/notifications/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(
  to: string[],
  subject: string,
  html: string
) {
  await transporter.sendMail({
    from: `"Project Hub" <${process.env.SMTP_USER}>`,
    to: to.join(', '),
    subject,
    html,
  });
}
```

### Email Templates

```typescript
// src/lib/notifications/templates.ts
export function getEODSubmittedEmail(data: {
  userName: string;
  projectName: string;
  reportDate: string;
  clientUpdate: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EOD Report Submitted</h1>
          </div>
          <div class="content">
            <p><strong>${data.userName}</strong> submitted an EOD report for <strong>${data.projectName}</strong></p>
            <p><strong>Date:</strong> ${data.reportDate}</p>
            <p><strong>Update:</strong></p>
            <blockquote>${data.clientUpdate}</blockquote>
          </div>
          <div class="footer">
            <p>Project Hub - Team Management System</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
```

### Admin Recipients

Admins can configure recipient list in Settings:

```typescript
// GET /api/notifications/recipients
const recipients = await db.query.notificationRecipients.findMany();

// POST /api/notifications/recipients
await db.insert(notificationRecipients).values({
  email: 'admin@example.com',
});
```

---

## Push Notifications

### Web Push API Setup

Uses **Web Push API** with VAPID keys for browser notifications.

#### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key: BKxN...
Private Key: aB3d...
```

#### Environment Variables

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKxN...
VAPID_PRIVATE_KEY=aB3d...
VAPID_SUBJECT=mailto:your-email@example.com
```

### Client-Side Subscription

```typescript
// src/lib/notifications/push-client.ts
export async function subscribeToPush(userId: string) {
  // Request permission
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // Subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    ),
  });

  // Send subscription to server
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });

  return subscription;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### Server-Side Push

```typescript
// src/lib/notifications/push-server.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  // Get user subscriptions
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  // Send to all user devices
  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify({
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          data,
        })
      )
    )
  );
}
```

### Service Worker

Location: `public/sw.js`

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
```

---

## In-App Notifications

### Database Storage

```typescript
// src/lib/db/schema.ts
export const appNotifications = pgTable('app_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // info, success, warning, error
  isRead: boolean('is_read').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Real-time Delivery (Socket.IO)

```typescript
// Server
io.to(`user:${userId}`).emit('notification', {
  id: notification.id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  createdAt: notification.createdAt,
});

// Client
socket.on('notification', (notification) => {
  // Show toast
  toast(notification.title, {
    description: notification.message,
    variant: notification.type,
  });

  // Update notification list
  setNotifications((prev) => [notification, ...prev]);

  // Increment badge
  incrementNotificationCount();
});
```

### Notification Component

```tsx
// src/components/notifications/notification-bell.tsx
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications
    const socket = getSocket();
    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off('notification');
    };
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

## Slack Integration

### Webhook Setup

1. Go to Slack workspace settings
2. Apps → Incoming Webhooks
3. Add New Webhook to Workspace
4. Copy webhook URL

#### Environment Variable

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

### Send to Slack

```typescript
// src/lib/notifications/slack.ts
export async function sendSlackNotification(
  title: string,
  message: string,
  color: 'good' | 'warning' | 'danger' = 'good'
) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    return;
  }

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [
        {
          color,
          title,
          text: message,
          footer: 'Project Hub',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }),
  });
}
```

---

## User Preferences

### Preference Management

```typescript
// GET /api/notifications/preferences
const preferences = await db
  .select()
  .from(notificationPreferences)
  .where(eq(notificationPreferences.userId, userId))
  .limit(1);

// PATCH /api/notifications/preferences
await db
  .update(notificationPreferences)
  .set({
    emailEnabled: data.emailEnabled,
    pushEnabled: data.pushEnabled,
    inAppEnabled: data.inAppEnabled,
    slackEnabled: data.slackEnabled,
  })
  .where(eq(notificationPreferences.userId, userId));
```

### Settings UI

```tsx
// src/components/settings/notification-settings.tsx
export function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    slackEnabled: false,
  });

  const updatePreference = async (key: string, value: boolean) => {
    await apiClient.patch('/api/notifications/preferences', {
      [key]: value,
    });
    setPreferences({ ...preferences, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Email Notifications</Label>
          <Switch
            checked={preferences.emailEnabled}
            onCheckedChange={(value) =>
              updatePreference('emailEnabled', value)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Push Notifications</Label>
          <Switch
            checked={preferences.pushEnabled}
            onCheckedChange={(value) =>
              updatePreference('pushEnabled', value)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>In-App Notifications</Label>
          <Switch
            checked={preferences.inAppEnabled}
            onCheckedChange={(value) =>
              updatePreference('inAppEnabled', value)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Slack Notifications</Label>
          <Switch
            checked={preferences.slackEnabled}
            onCheckedChange={(value) =>
              updatePreference('slackEnabled', value)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Event Types

### Notification Events

```typescript
type NotificationEvent =
  | 'eod_submitted'
  | 'memo_submitted'
  | 'project_assigned'
  | 'project_created'
  | 'task_assigned'
  | 'task_completed'
  | 'comment_added'
  | 'mention'
  | 'deadline_approaching';
```

### Event Handlers

```typescript
// src/lib/notifications/events.ts
export const notificationHandlers: Record<
  NotificationEvent,
  (data: any) => NotificationContent
> = {
  eod_submitted: (data) => ({
    title: 'EOD Report Submitted',
    message: `${data.userName} submitted an EOD for ${data.projectName}`,
    type: 'info',
  }),

  memo_submitted: (data) => ({
    title: 'Memo Submitted',
    message: `${data.userName} submitted a memo for ${data.projectName}`,
    type: 'info',
  }),

  project_assigned: (data) => ({
    title: 'New Project Assignment',
    message: `You have been assigned to ${data.projectName}`,
    type: 'success',
  }),

  task_assigned: (data) => ({
    title: 'New Task Assignment',
    message: `You have been assigned task: ${data.taskName}`,
    type: 'info',
  }),

  deadline_approaching: (data) => ({
    title: 'Deadline Approaching',
    message: `Task "${data.taskName}" is due in ${data.hours} hours`,
    type: 'warning',
  }),
};
```

---

## Best Practices

### 1. Non-Blocking

Never await notification sending in critical paths:

```typescript
// ❌ Bad - blocks response
await sendNotification(params);
return NextResponse.json({ success: true });

// ✅ Good - fire and forget
sendNotification(params).catch(console.error);
return NextResponse.json({ success: true });
```

### 2. Graceful Degradation

```typescript
try {
  await sendEmail(...);
} catch (error) {
  console.error('Email failed:', error);
  // Don't throw - other channels still work
}
```

### 3. Rate Limiting

```typescript
// Prevent notification spam
const lastNotification = await getLastNotification(userId, event);

if (lastNotification && Date.now() - lastNotification.createdAt < 60000) {
  console.log('Rate limited notification');
  return;
}
```

### 4. Batching

```typescript
// Batch multiple events into digest
const digest = await getUnreadNotifications(userId, since24HoursAgo);

if (digest.length > 0) {
  await sendDigestEmail(userId, digest);
}
```

---

## Related Documentation

- [Real-time Features](../backend/realtime-socketio.md)
- [API Routes](../api/routes-reference.md)
- [Database Schema](../database/schema.md)

---

**Last Updated:** 2026-02-02
