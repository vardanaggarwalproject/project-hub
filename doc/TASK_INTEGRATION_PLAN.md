# Task Management System: Database Integration Plan

## 📋 Overview

This document outlines the complete plan to transition the Kanban task management system from dummy data to real database operations with authentication, real-time updates, and full CRUD functionality.

---

## 🔍 Current State

### ✅ What Exists
- **Database tables**: `tasks`, `userTaskAssignments` already exist
- **Basic API**: `GET /api/tasks` and `POST /api/tasks`
- **UI Components**: KanbanBoard, Board, Column, TaskCard, AddTaskModal
- **Drag-and-drop**: Working with @dnd-kit (local state only)

### ❌ What's Missing
- No authentication in tasks API
- No column management (hardcoded as "To Do", "In Progress", "Complete")
- No task ordering/positioning
- No UPDATE/DELETE endpoints
- Frontend uses dummy data
- No real-time sync between users

---

## 🎯 Solution Architecture

### Database Enhancements

#### New Table: `task_columns`
```sql
CREATE TABLE "task_columns" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    position INTEGER NOT NULL,
    project_id TEXT,  -- Links to projects
    user_id TEXT,     -- For user-specific columns
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Enhanced `tasks` Table
```sql
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN column_id TEXT;  -- Links to task_columns
ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN tags JSONB DEFAULT '[]';
```

---

## 🚀 Implementation Steps

### Phase 1: Database (Days 1-2)

1. **Create migration file**: `drizzle/0009_add_task_columns.sql`
2. **Run migration**: `npm run db:migrate`
3. **Update schema**: `src/lib/db/schema.ts`
4. **Seed default columns**: To Do, In Progress, Complete

### Phase 2: API Endpoints (Days 3-5)

#### 2.1 Enhance `src/app/api/tasks/route.ts`
```typescript
// Add authentication
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Enhanced GET - filter by projectId, columnId, status
// Enhanced POST - create task with assignments
```

#### 2.2 Create `src/app/api/tasks/[id]/route.ts`
```typescript
GET    /api/tasks/[id]       // Get single task
PATCH  /api/tasks/[id]       // Update task
DELETE /api/tasks/[id]       // Delete task
```

#### 2.3 Create `src/app/api/tasks/reorder/route.ts`
```typescript
POST /api/tasks/reorder  // Handle drag-and-drop persistence
```

#### 2.4 Create `src/app/api/columns/route.ts`
```typescript
GET  /api/columns         // Get columns for project
POST /api/columns         // Create new column
```

#### 2.5 Create `src/app/api/columns/[id]/route.ts`
```typescript
PATCH  /api/columns/[id]  // Update column
DELETE /api/columns/[id]  // Delete column
```

### Phase 3: API Client (Day 6)

**Extend `src/lib/api/client.ts`**
```typescript
export const tasksApi = {
    getAll(params),
    getById(id),
    create(data),
    update(id, data),
    delete(id),
    reorder(data)
};

export const columnsApi = {
    getAll(params),
    create(data),
    update(id, data),
    delete(id)
};
```

### Phase 4: Frontend Integration (Days 7-10)

#### 4.1 Update `src/components/mytask/KanbanBoard.tsx`

**Replace dummy data with API**:
```typescript
const [selectedProjectId, setSelectedProjectId] = useState("");
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
    // Fetch projects
    const fetchProjects = async () => {
        const result = await projectsApi.getAll(...);
        setProjects(result.data);
        setSelectedProjectId(result.data[0]?.id);
    };
    fetchProjects();
}, []);

useEffect(() => {
    // Fetch board data
    const fetchBoard = async () => {
        const columns = await columnsApi.getAll({ projectId });
        const tasks = await tasksApi.getAll({ projectId });

        const columnsWithTasks = columns.map(col => ({
            ...col,
            tasks: tasks.filter(t => t.columnId === col.id)
        }));

        setBoard({ columns: columnsWithTasks });
    };
    fetchBoard();
}, [selectedProjectId]);
```

**Add Socket.IO for real-time updates**:
```typescript
useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_APP_URL);

    socket.on("connect", () => {
        socket.emit("join-project", selectedProjectId);
    });

    socket.on("task-created", (data) => {
        // Add task to board
    });

    socket.on("task-updated", (data) => {
        // Update task
    });

    socket.on("task-deleted", (data) => {
        // Remove task
    });

    return () => socket.disconnect();
}, [selectedProjectId]);
```

#### 4.2 Update `src/components/mytask/Board.tsx`

**Replace all handlers with API calls**:
```typescript
const handleSubmitTask = async (taskData) => {
    if (editingTask) {
        await tasksApi.update(editingTask.id, {...});
    } else {
        await tasksApi.create({
            name: taskData.title,
            projectId,
            columnId: selectedColumnId,
            ...
        });
    }
};

const handleDeleteTask = async (taskId) => {
    await tasksApi.delete(taskId);
    // Update local state
};

const handleDragEnd = async (event) => {
    // Optimistically update UI
    const oldColumns = [...columns];
    onColumnsChange(newColumns);

    try {
        await tasksApi.reorder({
            taskId,
            sourceColumnId,
            destinationColumnId,
            position
        });
    } catch (error) {
        onColumnsChange(oldColumns); // Rollback
    }
};
```

---

## 📊 Data Structure Mapping

### Database ↔ UI Translation

| Database Field | UI Field | Notes |
|---------------|----------|-------|
| `name` | `title` | Need mapper |
| `deadline` | `dueDate` | Need mapper |
| `priority` | `priority` | Same |
| `columnId` | N/A | New field |
| `position` | N/A | New field |
| `tags` | `tags` | Same |

**Create mapper**: `src/lib/mappers/task-mapper.ts`

---

## ✅ Testing Checklist

### Manual Testing
- [ ] Create task → appears in database
- [ ] Edit task → updates in database
- [ ] Delete task → removes from database
- [ ] Drag task between columns → saves columnId and position
- [ ] Reorder tasks within column → saves position
- [ ] Multiple users see real-time updates
- [ ] Add custom column → persists
- [ ] Delete column → tasks remain (columnId = NULL)
- [ ] Assign multiple users → creates userTaskAssignments

### Database Verification
```sql
-- Check tasks
SELECT id, name, column_id, position, priority FROM tasks;

-- Check columns
SELECT * FROM task_columns ORDER BY position;

-- Check assignments
SELECT t.name, u.name as assignee
FROM tasks t
JOIN user_task_assignments uta ON t.id = uta.task_id
JOIN user u ON uta.user_id = u.id;
```

### API Testing (via Postman)
```bash
GET    /api/tasks?projectId=<id>
POST   /api/tasks { name, projectId, columnId, ... }
PATCH  /api/tasks/<id> { name: "Updated" }
DELETE /api/tasks/<id>
POST   /api/tasks/reorder { taskId, destinationColumnId, position }
```

---

## 🗂️ Critical Files

### Must Create (NEW)
1. `drizzle/0009_add_task_columns.sql` - Migration
2. `src/app/api/tasks/[id]/route.ts` - Individual task CRUD
3. `src/app/api/tasks/reorder/route.ts` - Reorder endpoint
4. `src/app/api/columns/route.ts` - Columns CRUD
5. `src/app/api/columns/[id]/route.ts` - Individual column CRUD
6. `src/lib/mappers/task-mapper.ts` - Data transformation
7. `src/types/task.ts` - TypeScript types

### Must Modify (EXISTING)
1. `src/lib/db/schema.ts` - Add taskColumns, update tasks
2. `src/app/api/tasks/route.ts` - Add auth, enhance GET/POST
3. `src/lib/api/client.ts` - Add tasksApi, columnsApi
4. `src/components/mytask/KanbanBoard.tsx` - Replace dummy data
5. `src/components/mytask/Board.tsx` - Add API calls

---

## 🔐 Authentication Flow

```
User → KanbanBoard (check session)
  ↓
API Request (includes session headers)
  ↓
API Route (validate session)
  ↓
  ✓ Authorized → Process request
  ✗ Unauthorized → Return 401
```

**Pattern** (follow existing projects API):
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const userRole = session.user.role;
const currentUserId = session.user.id;

// Role-based filtering
if (userRole !== "admin" && projectId) {
    // Non-admin sees only assigned projects
    const assignments = await db.select()...;
}
```

---

## 📈 Real-Time Updates (Socket.IO)

### Events to Emit

| Event | When | Payload |
|-------|------|---------|
| `task-created` | POST /api/tasks | `{ task, projectId }` |
| `task-updated` | PATCH /api/tasks/[id] | `{ task, projectId }` |
| `task-deleted` | DELETE /api/tasks/[id] | `{ taskId, projectId }` |
| `task-reordered` | POST /api/tasks/reorder | `{ taskId, sourceColumnId, destinationColumnId, position }` |

### Client-Side Handling
```typescript
socket.on("task-created", (data) => {
    setBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col =>
            col.id === data.task.columnId
                ? { ...col, tasks: [...col.tasks, data.task] }
                : col
        )
    }));
});
```

---

## 🚨 Risk Mitigation

### High-Risk Areas
1. **Data Loss** → Backup database before migration
2. **Concurrent Edits** → Use optimistic locking
3. **Socket Disconnects** → Implement reconnection logic

### Rollback Plan
1. Keep migration with ROLLBACK statements
2. Keep `status` field for backward compatibility
3. Test on staging first
4. Deploy gradually (feature flags)

---

## 📅 Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| Week 1 | Database + API | Schema, migrations, all endpoints |
| Week 2 | Frontend | Component updates, Socket.IO |
| Week 3 | Testing | Manual, API, E2E tests |
| Week 4 | Polish | Error handling, optimization, deployment |

**Total: 3-4 weeks**

---

## 🎯 Success Criteria

✅ **Functional**
- Tasks persist across sessions
- Drag-and-drop saves to database
- Real-time updates for all users
- Authentication prevents unauthorized access
- Multi-user assignment works

✅ **Performance**
- API response < 500ms
- Page load < 2s
- Socket reconnects on disconnect

✅ **Quality**
- Zero data loss
- 99.9% uptime
- All tests pass

---

## 📝 Next Steps

1. ✅ **Review this plan**
2. Create migration file
3. Run migration
4. Implement API endpoints
5. Update frontend components
6. Test thoroughly
7. Deploy to staging
8. Deploy to production

---

**Created**: January 21, 2026
**Status**: Awaiting approval
**Estimated effort**: 3-4 weeks
