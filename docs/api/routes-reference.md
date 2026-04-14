# API Routes Reference

> **Last Updated:** 2026-02-02
> **API Style:** RESTful
> **Base URL:** `/api`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Projects](#projects)
4. [Tasks](#tasks)
5. [Columns](#columns)
6. [EODs](#eods)
7. [Memos](#memos)
8. [Chat](#chat)
9. [Clients](#clients)
10. [Users](#users)
11. [Notifications](#notifications)
12. [Links & Assets](#links--assets)
13. [Admin Stats](#admin-stats)

---

## Overview

### API Conventions

- **Content-Type:** `application/json`
- **Authentication:** Session-based (cookies)
- **Status Codes:**
  - `200` - Success
  - `201` - Created
  - `400` - Bad Request
  - `401` - Unauthorized
  - `403` - Forbidden
  - `404` - Not Found
  - `500` - Internal Server Error

### Response Format

**Success:**
```json
{
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Making API Calls

Use the centralized API client (`lib/api/client.ts`):

```typescript
import { apiClient } from "@/lib/api/client";

const response = await apiClient.get("/api/projects");
const data = response.data;
```

---

## Authentication

Base: `/api/auth`

### Better Auth Routes

Better Auth provides these routes automatically:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-in/email` | Login with email/password |
| POST | `/api/auth/sign-up/email` | Register new account |
| POST | `/api/auth/sign-out` | Logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/session` | Get current session |

### Login Example

```typescript
const response = await fetch("/api/auth/sign-in/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
  }),
});
```

---

## Projects

Base: `/api/projects`

### List Projects

```http
GET /api/projects
```

**Query Parameters:**
- `clientId` (optional) - Filter by client

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Project Name",
      "clientId": "uuid",
      "status": "active",
      "description": "...",
      "totalTime": 100,
      "completedTime": 50,
      "isMemoRequired": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "client": {
        "id": "uuid",
        "name": "Client Name"
      }
    }
  ]
}
```

**Authorization:**
- Admin: All projects
- Others: Only assigned projects

---

### Get Project

```http
GET /api/projects/[id]
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Project Name",
    "client": { /* client details */ },
    "assignedUsers": [
      {
        "id": "uuid",
        "name": "User Name",
        "role": "developer"
      }
    ]
  }
}
```

---

### Create Project

```http
POST /api/projects
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "New Project",
  "clientId": "uuid",
  "status": "active",
  "description": "Project description",
  "totalTime": 100,
  "completedTime": 0,
  "isMemoRequired": true
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "New Project",
    /* ... */
  }
}
```

---

### Update Project

```http
PATCH /api/projects/[id]
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "completed"
}
```

---

### Delete Project

```http
DELETE /api/projects/[id]
```

**Authorization:** Admin only

**Cascade Deletes:**
- All tasks
- All EODs
- All memos
- All assignments
- Chat group

---

### Assign Users to Project

```http
POST /api/projects/[id]/assignment
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "userIds": ["uuid1", "uuid2"]
}
```

---

### Toggle Active Project

```http
PATCH /api/projects/[id]/assignment/toggle-active
```

**Request Body:**
```json
{
  "isActive": true
}
```

**Purpose:** User marks project as currently active

---

## Tasks

Base: `/api/tasks`

### List Tasks

```http
GET /api/tasks?projectId=uuid&columnId=uuid&status=todo
```

**Query Parameters:**
- `projectId` (required)
- `columnId` (optional)
- `status` (optional)
- `assignedToMe` (optional) - boolean

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "shortId": "TSK-1234",
      "name": "Task name",
      "description": "Task description",
      "status": "todo",
      "priority": "high",
      "deadline": "2024-01-15T00:00:00Z",
      "position": 0,
      "type": "feature",
      "hoursSpent": 5,
      "projectId": "uuid",
      "columnId": "uuid",
      "assignedUsers": [
        {
          "id": "uuid",
          "name": "User Name",
          "email": "user@example.com"
        }
      ]
    }
  ]
}
```

---

### Get Task

```http
GET /api/tasks/[id]
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "shortId": "TSK-1234",
    "name": "Task name",
    /* ... all task fields ... */
    "project": { /* project details */ },
    "assignedUsers": [ /* users */ ],
    "comments": [ /* comments */ ]
  }
}
```

---

### Create Task

```http
POST /api/tasks
```

**Request Body:**
```json
{
  "name": "New Task",
  "description": "Task description",
  "projectId": "uuid",
  "columnId": "uuid",
  "status": "todo",
  "priority": "medium",
  "type": "feature",
  "deadline": "2024-01-15T00:00:00Z",
  "assignedUserIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "shortId": "TSK-1234",
    /* ... */
  }
}
```

---

### Update Task

```http
PATCH /api/tasks/[id]
```

**Request Body:**
```json
{
  "name": "Updated Task Name",
  "status": "in-progress",
  "hoursSpent": 8,
  "assignedUserIds": ["uuid1"]
}
```

---

### Delete Task

```http
DELETE /api/tasks/[id]
```

---

### Reorder Tasks (Drag & Drop)

```http
POST /api/tasks/reorder
```

**Request Body:**
```json
{
  "taskId": "uuid",
  "sourceColumnId": "uuid",
  "destinationColumnId": "uuid",
  "newPosition": 2
}
```

**Purpose:** Update task position and column after drag-and-drop

---

### Lookup Task by Short ID

```http
GET /api/tasks/lookup/[shortId]
```

**Example:** `GET /api/tasks/lookup/TSK-1234`

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "shortId": "TSK-1234",
    /* ... */
  }
}
```

---

### Task Comments

#### List Comments

```http
GET /api/tasks/[id]/comments
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Comment text",
      "userId": "uuid",
      "userName": "User Name",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Add Comment

```http
POST /api/tasks/[id]/comments
```

**Request Body:**
```json
{
  "content": "This is a comment"
}
```

---

### Task Subtasks

#### List Subtasks

```http
GET /api/tasks/[id]/subtasks
```

#### Create Subtask

```http
POST /api/tasks/[id]/subtasks
```

**Request Body:**
```json
{
  "title": "Subtask title",
  "completed": false
}
```

---

## Columns

Base: `/api/columns`

### List Columns

```http
GET /api/columns?projectId=uuid&userId=uuid
```

**Query Parameters:**
- `projectId` (optional) - Project-specific columns
- `userId` (optional) - User-specific columns
- If both omitted: Returns default columns

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "To Do",
      "color": "#3b82f6",
      "position": 0,
      "isDefault": false,
      "projectId": "uuid",
      "userId": null
    }
  ]
}
```

---

### Create Column

```http
POST /api/columns
```

**Request Body:**
```json
{
  "title": "New Column",
  "color": "#10b981",
  "position": 5,
  "projectId": "uuid", // Optional: project-specific
  "userId": "uuid"      // Optional: user-specific
}
```

---

### Update Column

```http
PATCH /api/columns/[id]
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "color": "#ef4444",
  "position": 3
}
```

---

### Delete Column

```http
DELETE /api/columns/[id]
```

**Note:** Cannot delete if tasks exist in column

---

## EODs

Base: `/api/eods`

### List EODs

```http
GET /api/eods?projectId=uuid&userId=uuid&fromDate=2024-01-01&toDate=2024-01-31
```

**Query Parameters:**
- `projectId` (optional)
- `userId` (optional)
- `fromDate` (optional) - ISO date string
- `toDate` (optional) - ISO date string

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "projectId": "uuid",
      "reportDate": "2024-01-15",
      "clientUpdate": "Public update for client",
      "actualUpdate": "Internal update for team",
      "createdAt": "2024-01-15T18:00:00Z",
      "user": {
        "name": "User Name"
      },
      "project": {
        "name": "Project Name"
      }
    }
  ]
}
```

---

### Create/Update EOD

```http
POST /api/eods
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "reportDate": "2024-01-15",
  "clientUpdate": "Today I worked on...",
  "actualUpdate": "Internal notes..."
}
```

**Note:** Auto-upserts if EOD exists for same date/project/user

---

### Update EOD

```http
PUT /api/eods/[id]
```

**Request Body:**
```json
{
  "clientUpdate": "Updated client update",
  "actualUpdate": "Updated internal update"
}
```

---

### Delete EOD

```http
DELETE /api/eods/[id]
```

---

### Weekly EODs

```http
GET /api/eods/weekly?userId=uuid&startDate=2024-01-01&endDate=2024-01-07
```

**Purpose:** Get EODs for a specific week

---

## Memos

Base: `/api/memos`

### List Memos

```http
GET /api/memos?projectId=uuid&userId=uuid&fromDate=2024-01-01&toDate=2024-01-31
```

**Query Parameters:** Same as EODs

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "projectId": "uuid",
      "reportDate": "2024-01-15",
      "memoContent": "Short memo (140 chars)",
      "memoType": "short",
      "createdAt": "2024-01-15T18:00:00Z"
    }
  ]
}
```

---

### Create Memo

```http
POST /api/memos
```

**Request Body (single):**
```json
{
  "projectId": "uuid",
  "reportDate": "2024-01-15",
  "memoContent": "Memo text (max 140 chars)",
  "memoType": "short"
}
```

**Request Body (bulk):**
```json
{
  "memos": [
    {
      "projectId": "uuid1",
      "reportDate": "2024-01-15",
      "memoContent": "Memo 1",
      "memoType": "short"
    },
    {
      "projectId": "uuid2",
      "reportDate": "2024-01-15",
      "memoContent": "Memo 2",
      "memoType": "universal"
    }
  ]
}
```

---

### Update Memo

```http
PUT /api/memos/[id]
```

---

### Delete Memo

```http
DELETE /api/memos/[id]
```

---

## Chat

Base: `/api/chat`

### Get Messages

```http
GET /api/chat/[projectId]
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Hello team!",
      "senderId": "uuid",
      "sender": {
        "name": "User Name",
        "image": "url"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Send Message

```http
POST /api/chat
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "content": "Message text"
}
```

**Real-time:** Message broadcasted via Socket.IO to room `group:${projectId}`

---

### Mark as Read

```http
POST /api/chat/[projectId]/read
```

**Purpose:** Update `lastReadAt` timestamp for user

---

### Unread Counts

```http
GET /api/chat/unread-counts
```

**Response:**
```json
{
  "data": {
    "uuid-project-1": 5,
    "uuid-project-2": 2
  }
}
```

---

## Clients

Base: `/api/clients`

### List Clients

```http
GET /api/clients
```

**Authorization:** Admin only

---

### Get Client

```http
GET /api/clients/[id]
```

---

### Create Client

```http
POST /api/clients
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "Client Name",
  "email": "client@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "description": "Client description"
}
```

---

### Update Client

```http
PATCH /api/clients/[id]
```

---

### Delete Client

```http
DELETE /api/clients/[id]
```

**Note:** Cannot delete if client has projects

---

## Users

Base: `/api/users`

### List Users

```http
GET /api/users
```

**Authorization:** Admin only

---

### Get User

```http
GET /api/users/[id]
```

---

### Update User

```http
PATCH /api/users/[id]
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "tester"
}
```

---

### Delete User

```http
DELETE /api/users/[id]
```

**Authorization:** Admin only

---

### Create User

```http
POST /api/admin/create-user
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "developer"
}
```

---

## Notifications

Base: `/api/notifications`

### Get Notifications

```http
GET /api/notifications
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "New EOD Submitted",
      "message": "User submitted EOD for Project X",
      "type": "info",
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Subscribe to Push

```http
POST /api/notifications/subscribe
```

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

---

### Get Preferences

```http
GET /api/notifications/preferences
```

**Response:**
```json
{
  "data": {
    "emailEnabled": true,
    "pushEnabled": true,
    "inAppEnabled": true,
    "slackEnabled": false
  }
}
```

---

### Update Preferences

```http
PATCH /api/notifications/preferences
```

**Request Body:**
```json
{
  "emailEnabled": false,
  "pushEnabled": true
}
```

---

### Test Email

```http
POST /api/notifications/test-email
```

**Authorization:** Admin only

---

## Links & Assets

### Links

Base: `/api/links`

#### List Links

```http
GET /api/links?projectId=uuid
```

#### Create Link

```http
POST /api/links
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "title": "Important Link",
  "description": "Description",
  "projectId": "uuid",
  "allowedRoles": ["admin", "developer"],
  "position": 0
}
```

#### Update Link

```http
PATCH /api/links/[id]
```

#### Delete Link

```http
DELETE /api/links/[id]
```

---

### Assets

Base: `/api/assets`

Same CRUD operations as Links, plus file upload.

#### Upload Asset

```http
POST /api/upload
```

**Request:** `multipart/form-data`

**Response:**
```json
{
  "data": {
    "url": "https://cloudinary.com/...",
    "publicId": "..."
  }
}
```

---

## Admin Stats

Base: `/api/admin/stats`

### Calendar Stats

```http
GET /api/admin/stats/calendar?month=2024-01
```

**Response:**
```json
{
  "data": {
    "2024-01-15": {
      "eodCount": 10,
      "memoCount": 8,
      "missingEods": 2,
      "missingMemos": 4
    }
  }
}
```

---

### Day Details

```http
GET /api/admin/stats/day-details?date=2024-01-15
```

**Response:**
```json
{
  "data": {
    "eods": [ /* EODs for that day */ ],
    "memos": [ /* Memos for that day */ ],
    "missing": {
      "eods": [ /* users who didn't submit */ ],
      "memos": [ /* users who didn't submit */ ]
    }
  }
}
```

---

## Error Handling

### Common Error Responses

**Unauthorized (401):**
```json
{
  "error": "Unauthorized",
  "message": "Please log in to access this resource"
}
```

**Forbidden (403):**
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

**Not Found (404):**
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

**Validation Error (400):**
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "email": "Invalid email format"
  }
}
```

---

## Rate Limiting

Currently not implemented. Consider adding for production:

- **Login:** 5 requests per minute
- **API calls:** 100 requests per minute per user
- **File uploads:** 10 requests per minute

---

## Related Documentation

- [Authentication Guide](../backend/authentication.md)
- [Database Schema](../database/schema.md)
- [Frontend API Client](../frontend/api-client.md)

---

**Last Updated:** 2026-02-02
