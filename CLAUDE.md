# Project Hub - Claude Reference Guide

> **Last Updated:** 2026-01-30
> **Branch:** feat/weekly-eod-view
> **Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Key Patterns & Conventions](#key-patterns--conventions)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Component Architecture](#component-architecture)
8. [State Management](#state-management)
9. [Authentication & Authorization](#authentication--authorization)
10. [Real-time Features](#real-time-features)
11. [Notification System](#notification-system)
12. [Development Setup](#development-setup)
13. [Important Guidelines](#important-guidelines)

---

## Project Overview

**Project Hub** is a comprehensive project management and team collaboration platform designed for software development agencies managing multiple client projects with distributed teams.

### Core Features

- **Project Management**: Multi-client project tracking with team assignments
- **Task Management**: Kanban boards with drag-and-drop, custom columns, multiple assignees
- **Daily Reporting**: EOD (End of Day) reports and memos for client/internal updates
- **Real-time Chat**: Project-based messaging with Socket.IO
- **Resource Management**: Links and assets with role-based access
- **Multi-channel Notifications**: In-app, email, push, Slack webhooks
- **Dashboard Analytics**: KPIs, calendar views, progress tracking
- **Role-based Access**: Admin, Developer, Tester, Designer roles

---

## Tech Stack

### Frontend
- **Next.js 16.1.1** (App Router) with **React 19.2.3**
- **TypeScript 5** (strict mode enabled)
- **Tailwind CSS 4** with custom semantic theme
- **shadcn/ui** (New York variant) - 50+ components
- **Radix UI** - Headless accessible primitives
- **@dnd-kit** - Drag and drop for Kanban
- **React Hook Form** + **Zod** - Forms and validation
- **Recharts** - Data visualization
- **date-fns** - Date manipulation
- **Lucide React** - Icons
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - RESTful endpoints
- **Custom Express Server** (`server.js`) - Socket.IO integration
- **Better Auth** - Email/password authentication
- **Drizzle ORM** - TypeScript-first ORM
- **PostgreSQL** (Supabase) - Database
- **Socket.IO** - WebSocket real-time communication
- **Nodemailer** - Email (Gmail SMTP)
- **Web Push API** - Browser notifications (VAPID)
- **Cloudinary** - File uploads/media management

---

## Project Structure

```
D:\workspace\project-hub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, register, forgot-password)
│   │   ├── admin/             # Admin dashboard & features
│   │   │   ├── dashboard/     # Admin KPIs & overview
│   │   │   ├── projects/      # Project CRUD
│   │   │   ├── tasks/         # Task management
│   │   │   ├── chat/          # Real-time chat
│   │   │   ├── eods/          # EOD reports management
│   │   │   ├── memos/         # Memos management
│   │   │   ├── clients/       # Client management
│   │   │   ├── developers/    # Developer management
│   │   │   ├── links/         # Link resources
│   │   │   ├── assets/        # Asset management
│   │   │   ├── users/         # User management
│   │   │   └── settings/      # Settings & preferences
│   │   ├── user/              # Regular user routes (mirror structure)
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Better Auth routes
│   │   │   ├── projects/      # Project endpoints
│   │   │   ├── tasks/         # Task CRUD & reorder
│   │   │   ├── columns/       # Column management
│   │   │   ├── eods/          # EOD endpoints
│   │   │   ├── memos/         # Memo endpoints
│   │   │   ├── chat/          # Chat messages
│   │   │   ├── notifications/ # Notification system
│   │   │   └── admin/         # Admin-specific APIs
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (50+)
│   │   ├── mytask/           # Kanban board components
│   │   ├── chat/             # Chat components
│   │   ├── dashboard/        # Dashboard widgets
│   │   ├── admin/            # Admin components
│   │   ├── settings/         # Settings panels
│   │   └── notifications/    # Notification UI
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzle schema (all tables)
│   │   │   ├── index.ts      # DB connection
│   │   │   └── utils.ts      # DB helper functions
│   │   ├── api/
│   │   │   └── client.ts     # Centralized API client
│   │   ├── notifications/    # Notification service (multi-channel)
│   │   ├── utils/            # Helper functions
│   │   ├── auth.ts           # Better Auth config
│   │   └── socket.ts         # Socket.IO client setup
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript definitions
│   └── common/               # Shared components
├── drizzle/                   # Database migrations
├── public/                    # Static assets (PWA manifest, icons)
├── server.js                  # Custom Node server (Next.js + Socket.IO)
└── package.json
```

---

## Key Patterns & Conventions

### Architectural Patterns

1. **Role-Based Access Control (RBAC)**
   - Roles: admin, developer, tester, designer
   - Route protection: `/admin/*` vs `/user/*`
   - API middleware validates roles

2. **Route Groups**
   - `(auth)` - Unauthenticated routes
   - `/admin` - Admin features
   - `/user` - Regular user features

3. **Centralized API Client** (`lib/api/client.ts`)
   - All frontend API calls go through this module
   - Consistent error handling
   - Auth token injection

4. **Server-Side Data Fetching**
   - Async Server Components (Next.js 16)
   - API calls in RSC for initial data
   - Client-side refetch for updates

5. **Optimistic UI Updates**
   - Immediate feedback (chat, drag-and-drop)
   - Rollback on API errors

### Code Conventions

- **File naming**: `kebab-case.tsx` for files, `PascalCase` for components
- **Path aliases**: `@/*` maps to `src/*`
- **TypeScript strict mode**: Enabled
- **Database IDs**: UUID v4 via `crypto.randomUUID()`
- **Date handling**: UTC in DB, local display via `date-fns`
- **API response shape**:
  ```typescript
  { data: T, meta?: { total, page } }  // Success
  { error: string, message: string }   // Error
  ```

### Component Patterns

- **Compound components** for complex UI (Board + Column + TaskCard)
- **Controlled components** with React Hook Form
- **"use client" directive** only when needed (interactivity, hooks)
- **Loading states** via Skeleton components
- **Error boundaries** for graceful degradation

---

## Database Schema

### Key Tables

#### `user`
- `id` (PK, UUID), `name`, `email`, `emailVerified`, `image`, `role` (enum)
- `createdAt`, `updatedAt`

#### `roles`
- `id` (PK), `name` (enum: admin, developer, tester, designer)

#### `clients`
- `id` (PK), `name`, `email`, `phone`, `address`, `description`

#### `projects`
- `id` (PK), `name`, `clientId` (FK), `status`, `totalTime`, `completedTime`
- `description`, `isMemoRequired` (boolean)

#### `user_project_assignments`
- `id` (PK), `userId` (FK), `projectId` (FK)
- `assignedAt`, `lastReadAt`, `lastActivatedAt`
- **`isActive`** (boolean) - User toggles active work status
- Unique: `(userId, projectId)`

#### `tasks`
- `id` (PK), `name`, `description`, `status`, `deadline`
- `projectId` (FK), `columnId` (FK), `priority`, `position`, `type`

#### `task_columns`
- `id` (PK), `title`, `color`, `position`
- `projectId` (FK), `userId` (FK), `isDefault`
- Supports project-wide OR user-specific columns

#### `user_task_assignments`
- `id` (PK), `userId` (FK), `taskId` (FK)
- Many-to-many for multiple assignees

#### `task_comments`
- `id` (PK), `taskId` (FK), `userId` (FK), `content`, `createdAt`

#### `eod_reports`
- `id` (PK), `userId` (FK), `projectId` (FK), `reportDate`
- `clientUpdate` (public), `actualUpdate` (internal)
- Index: `(userId, projectId, reportDate)`

#### `memos`
- `id` (PK), `userId` (FK), `projectId` (FK), `reportDate`
- `memoContent`, `memoType` (short, universal)
- Unique: `(userId, projectId, reportDate, memoType)`

#### `chat_groups`
- `id` (PK), `name`, `projectId` (FK)
- One-to-one with projects

#### `messages`
- `id` (PK), `senderId` (FK), `groupId` (FK), `content`, `createdAt`

#### `links` & `assets`
- Project resources with `allowedRoles` (JSONB array)
- `position` for ordering

#### `notification_preferences`
- Per-user channel settings (email, push, inApp, slack)

#### `notification_recipients`
- Admin email recipient list

#### `push_subscriptions`
- Web Push API endpoints

#### `app_notifications`
- In-app notification storage

### Key Constraints

- **Foreign Keys**: Cascade deletes (e.g., delete project deletes tasks)
- **Unique constraints**: Prevent duplicate EODs/memos per date
- **Indexes**: On frequently queried columns (userId, projectId, dates)

---

## API Routes

### Authentication
- `POST /api/auth/[...all]` - Better Auth catch-all

### Projects
- `GET /api/projects` - List (filtered by role)
- `POST /api/projects` - Create
- `GET /api/projects/[id]` - Get single
- `PATCH /api/projects/[id]` - Update
- `DELETE /api/projects/[id]` - Delete (cascades)
- `POST /api/projects/[id]/assignment` - Assign users
- `PATCH /api/projects/[id]/assignment/toggle-active` - Toggle active status

### Tasks
- `GET /api/tasks?projectId=&columnId=&status=` - List
- `POST /api/tasks` - Create
- `GET /api/tasks/[id]` - Get
- `PATCH /api/tasks/[id]` - Update
- `DELETE /api/tasks/[id]` - Delete
- `POST /api/tasks/reorder` - Drag-and-drop reorder
- `GET /api/tasks/[id]/comments` - Get comments
- `POST /api/tasks/[id]/comments` - Add comment

### Columns
- `GET /api/columns?projectId=&userId=` - List
- `POST /api/columns` - Create
- `PATCH /api/columns/[id]` - Update
- `DELETE /api/columns/[id]` - Delete

### EODs & Memos
- `GET /api/eods?projectId=&userId=&fromDate=&toDate=`
- `POST /api/eods` - Create/update (auto-upsert on same date)
- `PUT /api/eods/[id]` - Update
- `DELETE /api/eods/[id]`
- `GET /api/memos` - Same query pattern
- `POST /api/memos` - Supports bulk creation

### Chat
- `GET /api/chat/[projectId]` - Get messages
- `POST /api/chat` - Send message
- `POST /api/chat/[projectId]/read` - Mark as read
- `GET /api/chat/unread-counts` - Per-project unread counts

### Notifications
- `GET /api/notifications` - User notifications
- `POST /api/notifications/subscribe` - Push subscription
- `GET /api/notifications/preferences` - Get settings
- `PATCH /api/notifications/preferences` - Update settings
- `GET /api/notifications/recipients` - Admin recipients
- `POST /api/notifications/test-email` - Test email

### Admin
- `POST /api/admin/create-user` - Create user
- `GET /api/admin/stats/calendar` - Calendar view stats
- `GET /api/admin/stats/day-details` - Daily breakdown

---

## Component Architecture

### Design System

Based on **shadcn/ui** (New York variant) with custom theme:

- **50+ reusable UI components** in `src/components/ui/`
- **Custom semantic colors**: `--text-heading`, `--bg-card`, `--border-subtle`, etc.
- **Light/Dark mode** via `next-themes`
- **Notion-inspired dark theme**: Very dark backgrounds (#191919)

### Key Component Hierarchies

#### Kanban Board
```
KanbanBoard (container)
  └─ Board (DnD context, @dnd-kit)
      ├─ Column (droppable zone)
      │   └─ SortableTask (draggable)
      │       └─ TaskCard (presentation)
      ├─ AddColumnButton
      ├─ AddTaskModal
      ├─ EditColumnModal
      └─ TaskDetailModal (inline editing)
```

#### Chat System
```
ChatView (admin/user specific)
  ├─ ChatSidebar (project list, unread counts)
  └─ ChatWindow (messages, input, typing indicators)
```

#### Dashboard
```
DashboardPage
  ├─ StatsCards (KPIs)
  ├─ ProjectsSection (active projects table)
  └─ MissingUpdatesSection (overdue EODs/memos)
```

### Shared Components

- **`GenericFormSheet`** - Reusable form drawer
- **`ProjectFormSheet`** - Project creation/editing
- **`UpdateModal`** - EOD/Memo submission
- **`ProjectDetailsModal`** - Read-only project view
- **`ActionButtons`** - CRUD buttons
- **`DynamicFieldsInput`** - Dynamic form fields

---

## State Management

### Hybrid Approach

#### Server State
- **Next.js Server Components** for initial data
- **Manual React Query pattern**: `useEffect` + `useState`
- **Centralized API client** (`lib/api/client.ts`)
- **Cache revalidation** via Next.js `revalidate`

#### Client State
- **React useState** for local state
- **React Context** for theme only (`next-themes`)
- **URL State** for filters via `searchParams`

#### Real-time State
- **Socket.IO listeners** update local state
- **Optimistic updates** for UX (chat, DnD)
- **Rollback mechanisms** on API errors

#### Form State
- **React Hook Form** for all forms
- **Zod schemas** for validation
- **Controlled inputs**

**No global state library** (Redux, Zustand, etc.) - State co-located with components.

---

## Authentication & Authorization

### Better Auth Setup

- **Email/password authentication**
- **Session-based** with secure tokens
- **Password reset flow** via email
- **Role-based permissions**: admin, developer, tester, designer

### Route Protection

#### Server Components
```typescript
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user) redirect("/login");
if (session.user.role !== "admin") redirect("/user/dashboard");
```

#### API Routes
```typescript
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Authorization Patterns

- **Admin-only routes**: `/admin/*`
- **User routes**: `/user/*`
- **API middleware**: Validates session and role
- **Row-level filtering**: Users only see assigned projects
- **Auto-admin assignment**: Admins added to all projects

---

## Real-time Features

### Socket.IO Setup

#### Server (`server.js`)
```javascript
const io = new Server(server);

io.on("connection", (socket) => {
  // Join user-specific room
  socket.join(`user:${userId}`);

  // Join project chat room
  socket.join(`group:${projectId}`);

  // Emit events
  io.to(`group:${projectId}`).emit("new-message", message);
});
```

#### Client (`lib/socket.ts`)
```typescript
import { io } from "socket.io-client";

const socket = io();

// Listen for events
socket.on("new-message", (message) => {
  // Update state
});
```

### Room Structure
- **`user:${userId}`** - Private notifications
- **`group:${projectId}`** - Project chat
- **`task:${taskId}`** - Task comments (future)

### Events
- `new-message` - Chat message received
- `notification` - In-app notification
- `typing` - Typing indicators (planned)
- `task-update` - Task changes (planned)

---

## Notification System

### Multi-channel Architecture

#### Channels
1. **In-app**: Stored in DB, real-time via Socket.IO
2. **Email**: Gmail SMTP via Nodemailer
3. **Push**: Web Push API (VAPID)
4. **Slack**: Webhook integration

#### Event Types
- EOD submission
- Memo submission
- Project assignment
- Project creation

#### User Preferences
Per-user settings stored in `notification_preferences`:
```typescript
{
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  slackEnabled: boolean;
}
```

#### Implementation (`lib/notifications/service.ts`)
```typescript
await sendNotification({
  event: "eod_submitted",
  data: { userId, projectId, reportDate },
  recipients: ["admin1@example.com"],
});

// Triggers all enabled channels in parallel
// Non-blocking with 3s timeout per service
```

---

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase account)
- pnpm (package manager)

### Environment Variables

Create `.env`:
```bash
# Database (Supabase)
DATABASE_URL=postgresql://... (pooler connection)
DIRECT_URL=postgres://... (direct connection)

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Email (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Cloudinary (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Installation

```bash
# Install dependencies
pnpm install

# Generate migration
pnpm run generate

# Run migration
pnpm run migrate

# Seed admin user
pnpm run seed-admin

# Seed default columns
pnpm run seed-columns

# Start dev server (Next.js + Socket.IO)
pnpm dev
```

Server runs on `http://localhost:3000`

### Database Management

```bash
# Generate new migration
pnpm run generate

# Apply migrations
pnpm run migrate

# Drizzle Studio (DB GUI)
pnpm run db:studio
```

### Key Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm run generate` - Generate Drizzle migration
- `pnpm run migrate` - Apply migrations

---

## Important Guidelines

### When Working on Tasks

1. **Read existing code first** - Never propose changes without reading files
2. **Follow existing patterns** - Match component structure, naming, API patterns
3. **Use centralized API client** - All API calls through `lib/api/client.ts`
4. **Maintain type safety** - Update TypeScript types when changing schemas
5. **Test role-based access** - Verify admin vs user permissions
6. **Handle loading states** - Use skeleton components
7. **Handle errors gracefully** - Try-catch with user-friendly messages
8. **Preserve real-time features** - Update Socket.IO events if needed
9. **Update migrations** - Create new migration for schema changes
10. **Follow Tailwind theme** - Use semantic color variables

### Common Patterns to Follow

#### API Route Handler
```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Your logic here
    const data = await db.query...

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

#### Server Component with Data Fetching
```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await db.query...

  return <YourComponent data={data} />;
}
```

#### Client Component with API Call
```typescript
"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";

export function YourComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.get("/api/your-endpoint");
        setData(response.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Skeleton />;

  return <div>{/* Your UI */}</div>;
}
```

### Security Checklist

- Validate session in all protected routes
- Check role permissions for admin-only features
- Sanitize user input (use Zod schemas)
- Use parameterized queries (Drizzle ORM handles this)
- Don't expose sensitive data in API responses
- Verify user owns resource before update/delete
- Use HTTPS in production
- Secure environment variables

### Performance Tips

- Use `Promise.all()` for parallel API calls
- Add database indexes for common queries
- Implement pagination for large lists
- Use `revalidate` for Next.js caching
- Optimize images with Next.js Image component
- Debounce expensive operations (drag-and-drop)
- Use skeleton loading states
- Non-blocking notifications (fire-and-forget)

### Testing Considerations

- Test both admin and user roles
- Verify EOD/memo duplicate prevention
- Test drag-and-drop edge cases
- Verify Socket.IO reconnection
- Test push notification permissions
- Verify cascade deletes work correctly
- Test weekend skip logic in calendar
- Verify timezone handling (UTC storage, local display)

---

## Notable Implementation Details

### Weekend Detection
Missing updates calculation skips Saturdays and Sundays automatically.

### Duplicate Prevention
EODs and memos auto-update if same `(userId, projectId, reportDate)` exists.

### Cascading Deletes
Deleting a project removes:
- Tasks
- Columns
- EODs
- Memos
- Chat groups
- Messages
- User assignments

### Auto-admin Assignment
Admins are automatically added to all projects with `isActive = true`.

### Active Project Toggle
Users control which assigned projects they're actively working on via `isActive` boolean.

### Read Receipts
Chat messages track `lastReadAt` timestamp per user in `user_project_assignments`.

### Position Management
Tasks, columns, links, and assets use `position` field for custom ordering.

### Memo Types
- **Universal memo**: General updates (140 chars)
- **Short memo**: Project-specific (140 chars)
- Project setting `isMemoRequired` controls enforcement

---

## Current Development Status

**Active Branch:** `feat/weekly-eod-view`

### Recent Work
- Task integration with Kanban boards
- Weekly EOD view features
- UI improvements
- Documentation updates

### Production Readiness
The codebase is production-ready with:
- Comprehensive error handling
- Full authentication system
- Real-time features working
- Multi-channel notifications
- Role-based access control
- Database migrations managed

---

## Quick Reference

### File Locations
- **Database schema**: `src/lib/db/schema.ts`
- **API client**: `src/lib/api/client.ts`
- **Auth config**: `src/lib/auth.ts`
- **Socket.IO client**: `src/lib/socket.ts`
- **Notification service**: `src/lib/notifications/service.ts`
- **Theme variables**: `src/app/globals.css`
- **Server setup**: `server.js`
- **Migrations**: `drizzle/` directory

### Common Commands
```bash
pnpm dev              # Start dev server
pnpm run generate     # Create migration
pnpm run migrate      # Run migration
pnpm run db:studio    # Open Drizzle Studio
pnpm run seed-admin   # Create admin user
```

### Default Credentials
After running `pnpm run seed-admin`:
- Email: admin@projecthub.com
- Password: admin123
- Role: admin

---

**This guide should be updated whenever significant architectural changes are made to the project.**
