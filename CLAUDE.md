# Project Hub - Claude Reference Guide

> **Last Updated:** 2026-02-02
> **Branch:** main
> **Status:** Production Ready

---

## Quick Navigation

**📚 For detailed information, see the [comprehensive documentation in `/docs`](./docs)**

### Core Documentation

#### Architecture & Design
- **[Architecture Overview](./docs/architecture/overview.md)** - System design, tech stack, patterns, data flow
- **[Database Schema](./docs/database/schema.md)** - Complete schema, relationships, constraints, migrations

#### Backend
- **[Authentication & Authorization](./docs/backend/authentication.md)** - Better Auth setup, RBAC, route protection
- **[Real-time Features (Socket.IO)](./docs/backend/realtime-socketio.md)** - WebSocket setup, rooms, events, chat implementation

#### API
- **[API Routes Reference](./docs/api/routes-reference.md)** - Complete REST API documentation

#### Features
- **[Task Management & Kanban](./docs/features/task-management.md)** - Drag-and-drop, columns, assignments, comments
- **[EOD Reports & Memos](./docs/features/eod-memos.md)** - Daily reporting system, submission flow, tracking
- **[Notification System](./docs/features/notifications.md)** - Multi-channel (Email, Push, In-App, Slack), preferences

#### Development
- **[Development Setup](./docs/guides/development-setup.md)** - Installation, environment variables, troubleshooting

---

## Project Overview

**Project Hub** is a comprehensive project management and team collaboration platform for software development agencies managing multiple client projects with distributed teams.

### Core Features

- ✅ **Project Management** - Multi-client tracking with team assignments
- ✅ **Task Management** - Kanban boards with drag-and-drop, custom columns
- ✅ **Daily Reporting** - EOD reports and memos with dual updates (client + internal)
- ✅ **Real-time Chat** - Project-based messaging with Socket.IO
- ✅ **Resource Management** - Links and assets with role-based access
- ✅ **Multi-channel Notifications** - Email, Push, In-App, Slack
- ✅ **Dashboard Analytics** - KPIs, calendar views, missing updates tracking
- ✅ **Role-based Access** - Admin, Developer, Tester, Designer roles

---

## Tech Stack Summary

### Frontend
- **Next.js 16.1.1** (App Router) + **React 19.2.3** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (50+ components)
- **@dnd-kit** (drag-and-drop) + **React Hook Form** + **Zod**

### Backend
- **Next.js API Routes** + **Custom Express Server** (Socket.IO)
- **Better Auth** (session-based) + **Drizzle ORM** + **PostgreSQL** (Supabase)
- **Socket.IO** (real-time) + **Nodemailer** (email) + **Web Push API**

**📖 See [Architecture Overview](./docs/architecture/overview.md) for detailed tech stack**

---

## Project Structure

```
project-hub/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Public auth routes
│   │   ├── admin/               # Admin dashboard & features
│   │   ├── user/                # User features (mirror of admin)
│   │   └── api/                 # RESTful API endpoints
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (50+)
│   │   ├── mytask/              # Kanban board components
│   │   ├── chat/                # Chat system components
│   │   ├── dashboard/           # Dashboard widgets
│   │   └── notifications/       # Notification UI
│   └── lib/
│       ├── db/                  # Database (schema, connection)
│       ├── api/                 # Centralized API client
│       ├── notifications/       # Multi-channel notification service
│       ├── auth.ts              # Better Auth configuration
│       └── socket.ts            # Socket.IO client
├── docs/                        # 📚 Comprehensive documentation
│   ├── architecture/            # System design, patterns
│   ├── database/                # Schema, migrations
│   ├── backend/                 # Auth, real-time, services
│   ├── api/                     # API reference
│   ├── features/                # Feature-specific guides
│   └── guides/                  # Setup, deployment
├── drizzle/                     # Database migrations
├── server.js                    # Custom Node server (Next.js + Socket.IO)
└── package.json
```

**📖 See [Architecture Overview](./docs/architecture/overview.md) for detailed structure**

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL or Supabase account
- pnpm package manager

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Run migrations
pnpm run migrate

# 4. Seed admin user and default columns
pnpm run seed-admin
pnpm run seed-columns

# 5. Start development server
pnpm dev
```

**📖 See [Development Setup Guide](./docs/guides/development-setup.md) for detailed instructions**

---

## Key Concepts

### Authentication & Authorization

**Session-based authentication with Better Auth**
- **4 Roles**: `admin`, `developer`, `tester`, `designer`
- **Route Protection**: `/admin/*` vs `/user/*`
- **Admin**: Full access, user management, project creation
- **Others**: Limited to assigned projects and tasks

```typescript
// Server Component Route Protection
const session = await auth();
if (!session?.user) redirect("/login");
if (session.user.role !== "admin") redirect("/user/dashboard");
```

**📖 See [Authentication Guide](./docs/backend/authentication.md) for complete details**

---

### Database Schema

**PostgreSQL with Drizzle ORM**

**Core Tables:**
- `user` - User accounts with roles
- `projects` - Client projects
- `tasks` - Kanban tasks with drag-and-drop positioning
- `task_columns` - Customizable board columns (default, project-specific, user-specific)
- `eod_reports` - Daily EOD reports (dual updates: client + internal)
- `memos` - Short daily updates (140 chars, types: short/universal)
- `messages` - Real-time chat messages
- `app_notifications` - In-app notifications

**Key Features:**
- UUID primary keys
- Foreign key constraints with CASCADE deletes
- Unique constraints prevent duplicate EODs/memos per day
- Indexes on frequently queried columns

**📖 See [Database Schema](./docs/database/schema.md) for complete schema documentation**

---

### API Routes

**RESTful API with Next.js Route Handlers**

```
/api/auth/*              - Better Auth (login, register, password reset)
/api/projects/*          - Project CRUD, assignments
/api/tasks/*             - Task CRUD, reorder (drag-drop), comments
/api/columns/*           - Column management
/api/eods/*              - EOD reports (auto-upsert)
/api/memos/*             - Memo submission (bulk support)
/api/chat/*              - Chat messages, unread counts
/api/notifications/*     - Preferences, push subscriptions
/api/admin/*             - Admin-only endpoints (stats, user creation)
```

**📖 See [API Routes Reference](./docs/api/routes-reference.md) for complete API documentation**

---

### Real-time Features

**Socket.IO for bi-directional communication**

**Room Structure:**
- `user:${userId}` - Personal notifications
- `group:${projectId}` - Project chat rooms

**Events:**
- `new-message` - Chat messages
- `notification` - In-app notifications
- `typing` / `stop-typing` - Typing indicators

**📖 See [Real-time Features Guide](./docs/backend/realtime-socketio.md) for implementation details**

---

### Notification System

**Multi-channel architecture with user preferences**

**4 Channels:**
1. **Email** - Gmail SMTP via Nodemailer
2. **Push** - Web Push API (VAPID)
3. **In-App** - Real-time via Socket.IO
4. **Slack** - Webhook integration

**Event Types:**
- EOD/Memo submission
- Project/Task assignment
- Chat mentions
- Deadline approaching

**📖 See [Notification System Guide](./docs/features/notifications.md) for complete details**

---

### Task Management

**Kanban board with @dnd-kit**

**Features:**
- Drag-and-drop task reordering
- Custom columns (default, project-specific, user-specific)
- Multiple assignees per task
- Priority levels (low, medium, high, urgent)
- Task types (feature, bug, improvement, research)
- Short IDs (TSK-1234 format)
- Comments and discussions
- Time tracking (hoursSpent)

**Default Columns:**
1. Backlog (gray)
2. To Do (blue)
3. In Progress (yellow)
4. In Review (purple)
5. Done (green)

**📖 See [Task Management Guide](./docs/features/task-management.md) for implementation details**

---

### EOD Reports & Memos

**Daily reporting system for progress tracking**

**EOD Reports:**
- **Two updates**: Client-facing (public) + Internal (team only)
- **Auto-upsert**: Updating existing report for same date
- **Duplicate prevention**: One report per user/project/date
- **Weekly view**: Calendar visualization
- **Missing tracking**: Admin dashboard shows overdue reports

**Memos:**
- **Short updates**: 140 characters max
- **Two types**: Short (project-specific) + Universal (general)
- **Bulk submission**: Multiple memos in one API call
- **Required flag**: Projects can enforce memo submission

**📖 See [EOD & Memos Guide](./docs/features/eod-memos.md) for detailed workflows**

---

## Development Guidelines

### Code Patterns

#### API Route Handler Pattern
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
        const response = await apiClient.get("/api/endpoint");
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

### Best Practices

1. **Read existing code first** - Never propose changes without reading files
2. **Follow existing patterns** - Match component structure, naming, API patterns
3. **Use centralized API client** - All API calls through `lib/api/client.ts`
4. **Maintain type safety** - Update TypeScript types when changing schemas
5. **Test role-based access** - Verify admin vs user permissions
6. **Handle loading & error states** - Use skeleton components + try-catch
7. **Preserve real-time features** - Update Socket.IO events if needed
8. **Create migrations** - Run `pnpm run generate` after schema changes
9. **Follow Tailwind theme** - Use semantic color variables
10. **Non-blocking notifications** - Fire-and-forget with error handling

### Common Commands

```bash
pnpm dev                  # Start development server
pnpm build                # Build for production
pnpm start                # Start production server
pnpm lint                 # Run ESLint
pnpm run generate         # Generate Drizzle migration
pnpm run migrate          # Apply migrations
pnpm run db:studio        # Open Drizzle Studio (database GUI)
pnpm run seed-admin       # Seed admin user
pnpm run seed-columns     # Seed default Kanban columns
```

---

## File Locations (Quick Reference)

```
src/lib/db/schema.ts              # Database schema (Drizzle)
src/lib/api/client.ts             # Centralized API client
src/lib/auth.ts                   # Better Auth configuration
src/lib/socket.ts                 # Socket.IO client
src/lib/notifications/service.ts  # Multi-channel notification service
src/app/globals.css               # Tailwind theme variables
server.js                         # Custom Node server (Next.js + Socket.IO)
drizzle/                          # Database migrations
docs/                             # 📚 Comprehensive documentation
```

---

## Notable Implementation Details

- **Weekend Skip**: Missing updates calculation automatically skips Saturdays and Sundays
- **Auto-upsert**: EODs/memos auto-update if same (userId, projectId, reportDate) exists
- **Cascade Deletes**: Deleting a project removes tasks, columns, EODs, memos, chat, assignments
- **Auto-admin Assignment**: Admins automatically added to all projects with `isActive = true`
- **Active Project Toggle**: Users control which assigned projects they're actively working on
- **Read Receipts**: Chat messages track `lastReadAt` per user in `user_project_assignments`
- **Position Management**: Tasks, columns, links, assets use `position` for custom ordering
- **Short Task IDs**: TSK-1234 format for quick task lookup

---

## Default Credentials

After running `pnpm run seed-admin`:

```
Email:    admin@projecthub.com
Password: admin123
Role:     admin
```

**⚠️ Change password immediately after first login in production!**

---

## Documentation Index

### 📁 Architecture & Database
- [Architecture Overview](./docs/architecture/overview.md) - Complete system architecture
- [Database Schema](./docs/database/schema.md) - Full schema with ERD

### 📁 Backend
- [Authentication & Authorization](./docs/backend/authentication.md) - Auth setup, RBAC, security
- [Real-time Features](./docs/backend/realtime-socketio.md) - Socket.IO implementation

### 📁 API
- [API Routes Reference](./docs/api/routes-reference.md) - Complete REST API docs

### 📁 Features
- [Task Management & Kanban](./docs/features/task-management.md) - Complete task system
- [EOD Reports & Memos](./docs/features/eod-memos.md) - Daily reporting
- [Notification System](./docs/features/notifications.md) - Multi-channel notifications

### 📁 Development
- [Development Setup](./docs/guides/development-setup.md) - Installation & setup

---

## Getting Help

When working on tasks:
1. Check this reference guide first
2. Read the relevant documentation in `/docs`
3. Review existing code patterns
4. Follow established conventions

**For detailed implementation guides, always refer to the comprehensive documentation in the `/docs` folder.**

---

**This guide is a quick reference. For comprehensive documentation, see the `/docs` folder.**

**Last Updated:** 2026-02-02
