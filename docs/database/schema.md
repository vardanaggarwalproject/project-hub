# Database Schema Documentation

> **Last Updated:** 2026-02-02
> **ORM:** Drizzle ORM
> **Database:** PostgreSQL 14+

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Constraints](#constraints)
7. [Migrations](#migrations)

---

## Overview

The Project Hub database uses **PostgreSQL** with **Drizzle ORM** for type-safe database operations. The schema is defined in `src/lib/db/schema.ts`.

### Key Characteristics

- **UUID Primary Keys**: All tables use `uuid` for IDs
- **Timestamps**: `createdAt` and `updatedAt` tracked automatically
- **Soft Deletes**: Not implemented (hard deletes with cascade)
- **Foreign Keys**: Enforce referential integrity with CASCADE
- **Indexes**: On frequently queried columns

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐
│    user     │────┬────│   roles     │
└─────────────┘    │    └─────────────┘
       │           │
       │           │
       ├───────────┴──────────┐
       │                      │
       ▼                      ▼
┌──────────────────┐   ┌─────────────────────┐
│ user_project     │   │ user_task           │
│ _assignments     │   │ _assignments        │
└──────────────────┘   └─────────────────────┘
       │                      │
       │                      │
       ▼                      ▼
┌─────────────┐         ┌─────────────┐
│  projects   │────────▶│   tasks     │
└─────────────┘         └─────────────┘
       │                      │
       │                      │
       ├──────────┬───────────┤
       ▼          ▼           ▼
┌──────────┐ ┌──────┐  ┌─────────────┐
│   eod    │ │ memo │  │task_columns │
│ _reports │ │  s   │  └─────────────┘
└──────────┘ └──────┘         │
       │          │            │
       │          │            ▼
       │          │     ┌─────────────┐
       │          │     │    task     │
       │          │     │  _comments  │
       │          │     └─────────────┘
       │          │
       ▼          ▼
┌─────────────────────┐
│    clients          │
└─────────────────────┘

┌─────────────┐         ┌─────────────┐
│ chat_groups │────────▶│  messages   │
└─────────────┘         └─────────────┘

┌──────────────────┐   ┌──────────────────┐
│  links           │   │  assets          │
└──────────────────┘   └──────────────────┘

┌──────────────────────┐   ┌──────────────────┐
│ notification         │   │ push             │
│ _preferences         │   │ _subscriptions   │
└──────────────────────┘   └──────────────────┘

┌──────────────────────┐   ┌──────────────────┐
│ app_notifications    │   │ notification     │
│                      │   │ _recipients      │
└──────────────────────┘   └──────────────────┘
```

---

## Core Tables

### User Management

#### `user`

Stores user account information.

```typescript
{
  id: uuid (PK)
  name: text
  email: text (unique)
  emailVerified: boolean
  image: text | null
  role: enum('admin', 'developer', 'tester', 'designer')
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**
- `email` (unique)

**Relations:**
- One-to-many with `user_project_assignments`
- One-to-many with `user_task_assignments`
- One-to-many with `eod_reports`
- One-to-many with `memos`
- One-to-many with `messages`

---

#### `roles`

Defines available user roles.

```typescript
{
  id: serial (PK)
  name: enum('admin', 'developer', 'tester', 'designer')
}
```

**Seeded Roles:**
1. admin
2. developer
3. tester
4. designer

---

### Client Management

#### `clients`

Stores client/customer information.

```typescript
{
  id: uuid (PK)
  name: text
  email: text
  phone: text | null
  address: text | null
  description: text | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Relations:**
- One-to-many with `projects`

---

### Project Management

#### `projects`

Core project entity.

```typescript
{
  id: uuid (PK)
  name: text
  clientId: uuid (FK -> clients.id)
  status: enum('active', 'completed', 'on-hold', 'cancelled')
  totalTime: integer | null
  completedTime: integer | null
  description: text | null
  isMemoRequired: boolean (default: true)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Constraints:**
- Foreign Key: `clientId` references `clients(id)` ON DELETE CASCADE

**Indexes:**
- `clientId`
- `status`

**Relations:**
- Many-to-one with `clients`
- One-to-many with `user_project_assignments`
- One-to-many with `tasks`
- One-to-many with `eod_reports`
- One-to-many with `memos`
- One-to-one with `chat_groups`

---

#### `user_project_assignments`

Maps users to projects (many-to-many relationship).

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> user.id)
  projectId: uuid (FK -> projects.id)
  assignedAt: timestamp
  lastReadAt: timestamp | null
  lastActivatedAt: timestamp | null
  isActive: boolean (default: false)
}
```

**Constraints:**
- Unique: `(userId, projectId)`
- Foreign Keys:
  - `userId` references `user(id)` ON DELETE CASCADE
  - `projectId` references `projects(id)` ON DELETE CASCADE

**Indexes:**
- `(userId, projectId)` (unique)
- `projectId`
- `isActive`

**Purpose:**
- Tracks which users are assigned to which projects
- `isActive`: User toggles to indicate currently working on project
- `lastReadAt`: Chat read receipts
- `lastActivatedAt`: When user last activated the project

---

### Task Management

#### `tasks`

Individual task/work items.

```typescript
{
  id: uuid (PK)
  shortId: text (unique, e.g., "TSK-1234")
  name: text
  description: text | null
  status: enum('todo', 'in-progress', 'done', 'blocked')
  deadline: timestamp | null
  projectId: uuid (FK -> projects.id)
  columnId: uuid (FK -> task_columns.id)
  priority: enum('low', 'medium', 'high', 'urgent')
  position: integer
  type: enum('feature', 'bug', 'improvement', 'research')
  hoursSpent: integer | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Constraints:**
- Foreign Keys:
  - `projectId` references `projects(id)` ON DELETE CASCADE
  - `columnId` references `task_columns(id)` ON DELETE SET NULL
- Unique: `shortId`

**Indexes:**
- `projectId`
- `columnId`
- `status`
- `shortId` (unique)

**Relations:**
- Many-to-one with `projects`
- Many-to-one with `task_columns`
- One-to-many with `user_task_assignments`
- One-to-many with `task_comments`

---

#### `task_columns`

Kanban board columns (customizable per project or user).

```typescript
{
  id: uuid (PK)
  title: text
  color: text
  position: integer
  projectId: uuid | null (FK -> projects.id)
  userId: uuid | null (FK -> user.id)
  isDefault: boolean (default: false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Constraints:**
- Foreign Keys:
  - `projectId` references `projects(id)` ON DELETE CASCADE
  - `userId` references `user(id)` ON DELETE CASCADE

**Column Types:**
1. **Default Columns**: `isDefault = true`, no projectId/userId (global)
2. **Project Columns**: Has `projectId`, shared across project
3. **User Columns**: Has `userId`, personal columns

**Default Seeded Columns:**
1. Backlog (gray)
2. To Do (blue)
3. In Progress (yellow)
4. In Review (purple)
5. Done (green)

---

#### `user_task_assignments`

Maps users to tasks (many-to-many relationship).

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> user.id)
  taskId: uuid (FK -> tasks.id)
  assignedAt: timestamp
}
```

**Constraints:**
- Unique: `(userId, taskId)`
- Foreign Keys:
  - `userId` references `user(id)` ON DELETE CASCADE
  - `taskId` references `tasks(id)` ON DELETE CASCADE

**Purpose:**
- Allows multiple users assigned to single task
- Tracks assignment timestamp

---

#### `task_comments`

Comments/discussions on tasks.

```typescript
{
  id: uuid (PK)
  taskId: uuid (FK -> tasks.id)
  userId: uuid (FK -> user.id)
  content: text
  createdAt: timestamp
}
```

**Constraints:**
- Foreign Keys:
  - `taskId` references `tasks(id)` ON DELETE CASCADE
  - `userId` references `user(id)` ON DELETE CASCADE

**Indexes:**
- `taskId`
- `createdAt`

---

### Reporting System

#### `eod_reports`

End of Day reports (daily updates).

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> user.id)
  projectId: uuid (FK -> projects.id)
  reportDate: date
  clientUpdate: text
  actualUpdate: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Constraints:**
- Unique: `(userId, projectId, reportDate)`
- Foreign Keys:
  - `userId` references `user(id)` ON DELETE CASCADE
  - `projectId` references `projects(id)` ON DELETE CASCADE

**Indexes:**
- `(userId, projectId, reportDate)` (unique)
- `reportDate`

**Purpose:**
- `clientUpdate`: Public-facing update for client
- `actualUpdate`: Internal update for team/admin
- Duplicate prevention via unique constraint

---

#### `memos`

Short memo updates (140 characters).

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> user.id)
  projectId: uuid (FK -> projects.id)
  reportDate: date
  memoContent: text
  memoType: enum('short', 'universal')
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Constraints:**
- Unique: `(userId, projectId, reportDate, memoType)`
- Foreign Keys:
  - `userId` references `user(id)` ON DELETE CASCADE
  - `projectId` references `projects(id)` ON DELETE CASCADE

**Indexes:**
- `(userId, projectId, reportDate, memoType)` (unique)

**Memo Types:**
1. **Short Memo**: Project-specific (140 chars)
2. **Universal Memo**: General update (140 chars)

---

### Chat System

#### `chat_groups`

Chat groups (one per project).

```typescript
{
  id: uuid (PK)
  name: text
  projectId: uuid (FK -> projects.id, unique)
  createdAt: timestamp
}
```

**Constraints:**
- Unique: `projectId`
- Foreign Key: `projectId` references `projects(id)` ON DELETE CASCADE

**Relations:**
- One-to-one with `projects`
- One-to-many with `messages`

---

#### `messages`

Chat messages within groups.

```typescript
{
  id: uuid (PK)
  senderId: uuid (FK -> user.id)
  groupId: uuid (FK -> chat_groups.id)
  content: text
  createdAt: timestamp
}
```

**Constraints:**
- Foreign Keys:
  - `senderId` references `user(id)` ON DELETE CASCADE
  - `groupId` references `chat_groups(id)` ON DELETE CASCADE

**Indexes:**
- `groupId`
- `createdAt`

**Real-time:**
- Socket.IO broadcasts to room `group:${projectId}`

---

### Resource Management

#### `links`

Shareable links/resources.

```typescript
{
  id: uuid (PK)
  url: text
  title: text
  description: text | null
  projectId: uuid (FK -> projects.id)
  allowedRoles: jsonb (array of role names)
  position: integer
  createdAt: timestamp
}
```

**Constraints:**
- Foreign Key: `projectId` references `projects(id)` ON DELETE CASCADE

**Purpose:**
- Store important project links (docs, staging URLs, etc.)
- `allowedRoles`: Role-based access control (e.g., ["admin", "developer"])
- `position`: Custom ordering

---

#### `assets`

File/media assets.

```typescript
{
  id: uuid (PK)
  name: text
  url: text
  type: text
  size: integer
  projectId: uuid (FK -> projects.id)
  allowedRoles: jsonb (array of role names)
  position: integer
  uploadedBy: uuid (FK -> user.id)
  createdAt: timestamp
}
```

**Constraints:**
- Foreign Keys:
  - `projectId` references `projects(id)` ON DELETE CASCADE
  - `uploadedBy` references `user(id)` ON DELETE SET NULL

**Purpose:**
- Store project assets (images, PDFs, etc.)
- Hosted on Cloudinary
- Role-based access control

---

### Notification System

#### `notification_preferences`

Per-user notification channel settings.

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> user.id, unique)
  emailEnabled: boolean (default: true)
  pushEnabled: boolean (default: true)
  inAppEnabled: boolean (default: true)
  slackEnabled: boolean (default: false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Constraints:**
- Unique: `userId`
- Foreign Key: `userId` references `user(id)` ON DELETE CASCADE

---

#### `notification_recipients`

Admin email recipients for notifications.

```typescript
{
  id: uuid (PK)
  email: text (unique)
  createdAt: timestamp
}
```

**Purpose:**
- List of admin emails to receive all notifications
- Used by notification service

---

#### `push_subscriptions`

Web Push API subscriptions.

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> user.id)
  endpoint: text (unique)
  keys: jsonb
  createdAt: timestamp
}
```

**Constraints:**
- Unique: `endpoint`
- Foreign Key: `userId` references `user(id)` ON DELETE CASCADE

**Purpose:**
- Store browser push notification subscriptions
- `keys`: Contains p256dh and auth keys

---

#### `app_notifications`

In-app notifications storage.

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> user.id)
  title: text
  message: text
  type: enum('info', 'success', 'warning', 'error')
  isRead: boolean (default: false)
  metadata: jsonb | null
  createdAt: timestamp
}
```

**Constraints:**
- Foreign Key: `userId` references `user(id)` ON DELETE CASCADE

**Indexes:**
- `userId`
- `isRead`
- `createdAt`

---

## Relationships

### One-to-Many

| Parent | Child | Relationship |
|--------|-------|--------------|
| clients | projects | One client has many projects |
| projects | tasks | One project has many tasks |
| projects | eod_reports | One project has many EOD reports |
| projects | memos | One project has many memos |
| projects | chat_groups | One project has one chat group |
| chat_groups | messages | One chat group has many messages |
| user | messages | One user sends many messages |
| tasks | task_comments | One task has many comments |

### Many-to-Many

| Entity A | Join Table | Entity B |
|----------|------------|----------|
| user | user_project_assignments | projects |
| user | user_task_assignments | tasks |

---

## Indexes

### Purpose of Indexes

Indexes improve query performance on frequently searched columns.

### Index List

```sql
-- user table
CREATE UNIQUE INDEX user_email_idx ON user(email);

-- projects table
CREATE INDEX projects_client_id_idx ON projects(clientId);
CREATE INDEX projects_status_idx ON projects(status);

-- user_project_assignments table
CREATE UNIQUE INDEX user_project_assignments_unique_idx
  ON user_project_assignments(userId, projectId);
CREATE INDEX user_project_assignments_project_id_idx
  ON user_project_assignments(projectId);
CREATE INDEX user_project_assignments_is_active_idx
  ON user_project_assignments(isActive);

-- tasks table
CREATE INDEX tasks_project_id_idx ON tasks(projectId);
CREATE INDEX tasks_column_id_idx ON tasks(columnId);
CREATE INDEX tasks_status_idx ON tasks(status);
CREATE UNIQUE INDEX tasks_short_id_idx ON tasks(shortId);

-- eod_reports table
CREATE UNIQUE INDEX eod_reports_unique_idx
  ON eod_reports(userId, projectId, reportDate);
CREATE INDEX eod_reports_report_date_idx ON eod_reports(reportDate);

-- memos table
CREATE UNIQUE INDEX memos_unique_idx
  ON memos(userId, projectId, reportDate, memoType);

-- messages table
CREATE INDEX messages_group_id_idx ON messages(groupId);
CREATE INDEX messages_created_at_idx ON messages(createdAt);

-- app_notifications table
CREATE INDEX app_notifications_user_id_idx ON app_notifications(userId);
CREATE INDEX app_notifications_is_read_idx ON app_notifications(isRead);
CREATE INDEX app_notifications_created_at_idx ON app_notifications(createdAt);
```

---

## Constraints

### Foreign Key Constraints

All foreign keys use **ON DELETE CASCADE** to automatically clean up related data.

Example:
```sql
-- When a project is deleted, all its tasks are also deleted
ALTER TABLE tasks
  ADD CONSTRAINT tasks_project_id_fkey
  FOREIGN KEY (projectId) REFERENCES projects(id)
  ON DELETE CASCADE;
```

### Unique Constraints

Prevent duplicate data:

- `user.email`: No duplicate emails
- `tasks.shortId`: Unique task identifiers
- `(userId, projectId)`: User assigned to project only once
- `(userId, taskId)`: User assigned to task only once
- `(userId, projectId, reportDate)`: One EOD per user per project per day
- `(userId, projectId, reportDate, memoType)`: One memo per type per day

---

## Migrations

### Migration Workflow

```bash
# 1. Make changes to src/lib/db/schema.ts
# 2. Generate migration
pnpm run generate

# 3. Review generated SQL in drizzle/migrations/
# 4. Apply migration
pnpm run migrate
```

### Migration Files Location

```
drizzle/
├── migrations/
│   ├── 0000_initial_setup.sql
│   ├── 0001_add_hours_spent_to_tasks.sql
│   └── meta/
│       └── _journal.json
```

### Important Notes

- **Never edit migration files manually**
- **Always test migrations on staging first**
- **Backup database before production migrations**
- **Migrations are irreversible** (create new migration to undo)

---

## Best Practices

### When Adding New Tables

1. Use `uuid` for primary keys
2. Add `createdAt` timestamp
3. Add `updatedAt` if data changes
4. Include proper foreign key constraints
5. Add indexes on frequently queried columns
6. Document relationships in this file

### When Modifying Schema

1. Create a new migration (don't edit existing)
2. Test on local database first
3. Consider data migration if changing types
4. Update TypeScript types if needed
5. Update API documentation

### Performance Tips

- **Use indexes** on JOIN columns
- **Avoid SELECT \***: Only fetch needed columns
- **Use pagination** for large datasets
- **Batch inserts** when creating multiple records
- **Use transactions** for multi-step operations

---

## Schema Visualization

To visualize the database schema:

```bash
# Open Drizzle Studio
pnpm run db:studio

# Or use pgAdmin, DBeaver, etc. with connection string
```

---

## Related Documentation

- [API Routes Reference](../api/routes-reference.md) - API endpoints using these tables
- [Drizzle ORM Queries](../backend/database-queries.md) - Common query patterns
- [Migration Guide](../guides/migrations.md) - How to create and apply migrations

---

**Last Schema Update:** 2026-02-02
**Schema Version:** 1.0.0
