# Architecture Overview

> **Last Updated:** 2026-02-02
> **Status:** Production Ready

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Design Patterns](#design-patterns)
4. [Project Structure](#project-structure)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)

---

## System Architecture

### High-Level Architecture

Project Hub follows a **modern full-stack monolithic architecture** built on Next.js 16:

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Next.js    │  │  React 19    │  │  Tailwind    │  │
│  │  App Router  │  │  Components  │  │   + shadcn   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   API Gateway Layer                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Next.js API Routes (REST)                 │  │
│  │  /api/projects, /api/tasks, /api/eods, etc.     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth Service │  │ Notification │  │  Real-time   │  │
│  │ (Better Auth)│  │   Service    │  │  (Socket.IO) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    Data Access Layer                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Drizzle ORM (TypeScript-first)          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   Database Layer                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         PostgreSQL (Supabase Hosted)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

- **Server Components**: Default for data fetching and SSR
- **Client Components**: Interactive UI with "use client" directive
- **Hybrid Rendering**: Mix of SSR, CSR, and ISR as needed

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | Full-stack React framework |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | Latest | Component library |
| Radix UI | Latest | Headless primitives |
| @dnd-kit | Latest | Drag & drop |
| React Hook Form | Latest | Form management |
| Zod | Latest | Schema validation |
| Recharts | Latest | Data visualization |
| Lucide React | Latest | Icon library |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Next.js API Routes | 16.1.1 | RESTful APIs |
| Custom Express Server | Latest | Socket.IO integration |
| Better Auth | Latest | Authentication |
| Drizzle ORM | Latest | Database ORM |
| PostgreSQL | 14+ | Database |
| Socket.IO | 4.x | WebSocket communication |
| Nodemailer | Latest | Email service |
| Web Push API | Latest | Push notifications |
| Cloudinary | Latest | File uploads |

### DevOps & Tools

- **Package Manager**: pnpm
- **Version Control**: Git
- **Database Migrations**: Drizzle Kit
- **Environment**: .env files
- **Linting**: ESLint
- **TypeScript**: Strict mode enabled

---

## Design Patterns

### 1. Repository Pattern

Data access is centralized through Drizzle ORM:

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export const db = drizzle(connection, { schema });
```

### 2. Service Layer Pattern

Business logic separated from controllers:

```typescript
// lib/notifications/service.ts
export async function sendNotification(params) {
  // Multi-channel notification logic
  await Promise.allSettled([
    sendEmail(),
    sendPush(),
    sendInApp(),
    sendSlack()
  ]);
}
```

### 3. API Client Pattern

Centralized HTTP client for frontend:

```typescript
// lib/api/client.ts
export const apiClient = {
  get: async (url) => { /* ... */ },
  post: async (url, data) => { /* ... */ },
  // Consistent error handling
};
```

### 4. Compound Component Pattern

Complex UI components broken into composable pieces:

```typescript
<KanbanBoard>
  <Column>
    <TaskCard />
  </Column>
</KanbanBoard>
```

### 5. Role-Based Access Control (RBAC)

```typescript
// Middleware pattern
const session = await auth();
if (session.user.role !== 'admin') {
  return redirect('/user/dashboard');
}
```

### 6. Optimistic UI Updates

```typescript
// Update UI immediately
setMessages([...messages, newMessage]);

// Then sync with server
await apiClient.post('/api/chat', newMessage);
```

---

## Project Structure

```
project-hub/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Public auth routes
│   │   ├── admin/               # Admin-only routes
│   │   ├── user/                # User routes
│   │   └── api/                 # API endpoints
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn components
│   │   ├── mytask/              # Task management
│   │   ├── chat/                # Chat system
│   │   ├── dashboard/           # Dashboard widgets
│   │   └── notifications/       # Notification UI
│   │
│   ├── lib/                     # Core libraries
│   │   ├── db/                  # Database layer
│   │   │   ├── schema.ts        # Drizzle schema
│   │   │   └── index.ts         # DB connection
│   │   ├── api/                 # API client
│   │   ├── notifications/       # Notification service
│   │   ├── auth.ts              # Better Auth config
│   │   └── socket.ts            # Socket.IO client
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript definitions
│   └── common/                  # Shared utilities
│
├── drizzle/                     # Database migrations
├── public/                      # Static assets
├── docs/                        # Documentation
├── server.js                    # Custom Node server
└── package.json                 # Dependencies
```

### Key Directories

- **`app/(auth)/`**: Unauthenticated routes (login, register)
- **`app/admin/`**: Admin dashboard and features
- **`app/user/`**: Regular user features
- **`app/api/`**: RESTful API endpoints
- **`components/ui/`**: 50+ reusable shadcn components
- **`lib/db/`**: Database schema and connection
- **`lib/api/`**: Centralized API client

---

## Data Flow

### Request Flow (Server-Side Rendering)

```
1. User visits /admin/projects
         ↓
2. Next.js Server Component fetches data
   └─ await db.query.projects.findMany()
         ↓
3. Server renders HTML with data
         ↓
4. Client receives fully rendered page
```

### Request Flow (Client-Side)

```
1. User clicks "Create Task"
         ↓
2. React component calls API client
   └─ apiClient.post('/api/tasks', data)
         ↓
3. API route validates session
   └─ const session = await auth()
         ↓
4. API route processes request
   └─ await db.insert(tasks).values(data)
         ↓
5. API returns response
         ↓
6. Component updates UI
```

### Real-time Flow (WebSocket)

```
1. User sends chat message
         ↓
2. Client emits Socket.IO event
   └─ socket.emit('send-message', message)
         ↓
3. Server receives event
   └─ io.on('send-message', handler)
         ↓
4. Server saves to database
         ↓
5. Server broadcasts to room
   └─ io.to(`group:${projectId}`).emit('new-message')
         ↓
6. All connected clients receive update
```

---

## Security Architecture

### Authentication

- **Better Auth** for email/password authentication
- **Session-based** with secure HTTP-only cookies
- **Password hashing** with bcrypt
- **CSRF protection** built into Next.js

### Authorization

- **Role-based access control**: admin, developer, tester, designer
- **Route guards**: Middleware checks user role
- **API validation**: Every endpoint validates session
- **Row-level security**: Users only see assigned projects

### Data Security

- **Input validation**: Zod schemas on all forms
- **SQL injection protection**: Parameterized queries via Drizzle
- **XSS prevention**: React auto-escapes by default
- **Environment variables**: Sensitive data in .env files
- **HTTPS-only** in production

### API Security

```typescript
// Every protected API route follows this pattern
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check role if needed
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Process request...
}
```

---

## Performance Optimizations

### Frontend

- **Code splitting**: Automatic with Next.js App Router
- **Lazy loading**: Dynamic imports for heavy components
- **Image optimization**: Next.js Image component
- **Font optimization**: next/font
- **Static generation**: Pre-render pages where possible

### Backend

- **Database indexes**: On frequently queried columns
- **Connection pooling**: Managed by Supabase
- **Parallel queries**: `Promise.all()` for independent operations
- **Caching**: Next.js revalidate strategy

### Real-time

- **Room-based broadcasting**: Only send to relevant users
- **Debouncing**: Limit frequent events (typing indicators)
- **Optimistic updates**: Immediate UI feedback

---

## Scalability Considerations

### Current Scale

- **Single server deployment**
- **Suitable for**: 100-1000 concurrent users
- **Database**: Supabase managed PostgreSQL

### Future Scaling Options

1. **Horizontal Scaling**
   - Deploy multiple Next.js instances
   - Load balancer (Nginx/AWS ALB)
   - Redis for Socket.IO adapter (multi-server)

2. **Database Scaling**
   - Read replicas for queries
   - Connection pooling (PgBouncer)
   - Database sharding (if needed)

3. **Caching Layer**
   - Redis for session storage
   - CDN for static assets
   - API response caching

4. **Microservices (if needed)**
   - Separate notification service
   - Separate chat service
   - Message queue (RabbitMQ/SQS)

---

## Key Design Decisions

### Why Next.js App Router?

- **Server Components**: Reduce client bundle size
- **Streaming**: Progressive rendering
- **Built-in API routes**: No separate backend needed
- **File-based routing**: Intuitive structure

### Why Drizzle ORM?

- **TypeScript-first**: Full type safety
- **SQL-like syntax**: Easy to learn
- **Lightweight**: Minimal overhead
- **Migrations**: Built-in schema versioning

### Why Socket.IO?

- **Bi-directional**: Server can push to clients
- **Automatic reconnection**: Handles network issues
- **Room support**: Easy broadcasting
- **Fallback**: Works even if WebSocket blocked

### Why shadcn/ui?

- **Copy-paste**: Not an npm dependency
- **Customizable**: Full control over code
- **Accessible**: Built on Radix UI
- **Consistent**: Unified design system

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Better Auth Guide](https://better-auth.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**For detailed implementation guides, see:**
- [Database Schema](../database/schema.md)
- [API Routes](../api/routes-reference.md)
- [Frontend Components](../frontend/components.md)
- [Authentication Guide](../backend/authentication.md)
