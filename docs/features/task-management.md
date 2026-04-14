# Task Management & Kanban Board

> **Last Updated:** 2026-02-02
> **Feature:** Task Management with Kanban Board
> **Drag & Drop:** @dnd-kit library

---

## Table of Contents

1. [Overview](#overview)
2. [Task Structure](#task-structure)
3. [Kanban Board](#kanban-board)
4. [Task Columns](#task-columns)
5. [Drag and Drop](#drag-and-drop)
6. [Task Operations](#task-operations)
7. [Task Comments](#task-comments)
8. [Task Assignment](#task-assignment)
9. [Implementation Details](#implementation-details)

---

## Overview

Project Hub features a comprehensive task management system with a **Kanban board interface** for visual task tracking.

### Key Features

- ✅ **Drag-and-drop** task reordering
- ✅ **Custom columns** (per project or per user)
- ✅ **Multiple assignees** per task
- ✅ **Task priorities** (low, medium, high, urgent)
- ✅ **Task types** (feature, bug, improvement, research)
- ✅ **Short IDs** (TSK-1234 format)
- ✅ **Comments** and discussions
- ✅ **Time tracking** (hoursSpent)
- ✅ **Deadlines** with visual indicators
- ✅ **Subtasks** (checklist items)

---

## Task Structure

### Task Schema

```typescript
interface Task {
  id: string;                    // UUID
  shortId: string;               // TSK-1234 format
  name: string;                  // Task title
  description: string | null;    // Detailed description
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'feature' | 'bug' | 'improvement' | 'research';
  deadline: Date | null;
  projectId: string;             // FK
  columnId: string;              // FK
  position: number;              // For ordering within column
  hoursSpent: number | null;     // Time tracking
  createdAt: Date;
  updatedAt: Date;
}
```

### Task with Relations

```typescript
interface TaskWithRelations extends Task {
  project: Project;
  column: TaskColumn;
  assignedUsers: User[];
  comments: TaskComment[];
  subtasks: Subtask[];
}
```

### Short ID Generation

Format: `TSK-{4-digit-number}`

```typescript
// Automatically generated on task creation
function generateShortId(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TSK-${random}`;
}
```

**Note:** Short IDs are unique and used for quick task lookup.

---

## Kanban Board

### Board Structure

```
┌─────────────────────────────────────────────────────┐
│                  Kanban Board                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Backlog  │  │  To Do   │  │ Progress │  [+]    │
│  ├──────────┤  ├──────────┤  ├──────────┤         │
│  │ Task 1   │  │ Task 3   │  │ Task 5   │         │
│  │ Task 2   │  │ Task 4   │  │ Task 6   │         │
│  │          │  │          │  │          │         │
│  │ [+ Add]  │  │ [+ Add]  │  │ [+ Add]  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

### Component Hierarchy

```tsx
<KanbanBoard>
  <Board> {/* DnD context */}
    <Column columnId="uuid" title="To Do" color="#3b82f6">
      <SortableTask task={task1} />
      <SortableTask task={task2} />
      <AddTaskButton columnId="uuid" />
    </Column>

    <Column columnId="uuid" title="In Progress" color="#f59e0b">
      <SortableTask task={task3} />
    </Column>

    <AddColumnButton />
  </Board>
</KanbanBoard>
```

### File Locations

```
src/
├── app/
│   └── user/
│       └── tasks/
│           └── page.tsx             # Main Kanban page
├── components/
│   └── mytask/
│       ├── kanban-board.tsx         # Board container
│       ├── board.tsx                # DnD context
│       ├── column.tsx               # Column component
│       ├── sortable-task.tsx        # Draggable task wrapper
│       ├── task-card.tsx            # Task presentation
│       ├── add-task-modal.tsx       # Create task modal
│       ├── task-detail-modal.tsx    # View/edit task
│       ├── add-column-button.tsx    # Create column
│       └── edit-column-modal.tsx    # Edit column
```

---

## Task Columns

### Column Types

#### 1. Default Columns (Global)

Pre-seeded columns available to all users:

```typescript
const defaultColumns = [
  { title: 'Backlog', color: '#6b7280', position: 0 },
  { title: 'To Do', color: '#3b82f6', position: 1 },
  { title: 'In Progress', color: '#f59e0b', position: 2 },
  { title: 'In Review', color: '#8b5cf6', position: 3 },
  { title: 'Done', color: '#10b981', position: 4 },
];
```

#### 2. Project Columns

Columns shared across a project (all team members see them):

```typescript
{
  title: 'Design Review',
  color: '#ec4899',
  position: 3,
  projectId: 'uuid',
  userId: null,
  isDefault: false
}
```

#### 3. User Columns

Personal columns visible only to the creating user:

```typescript
{
  title: 'My Priority Tasks',
  color: '#ef4444',
  position: 0,
  projectId: null,
  userId: 'uuid',
  isDefault: false
}
```

### Column Schema

```typescript
interface TaskColumn {
  id: string;
  title: string;
  color: string;       // Hex color code
  position: number;    // Display order
  projectId: string | null;
  userId: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Creating Columns

```typescript
// API: POST /api/columns
await apiClient.post("/api/columns", {
  title: "Testing",
  color: "#f97316",
  position: 5,
  projectId: selectedProjectId, // Optional
  userId: currentUser.id,       // Optional
});
```

---

## Drag and Drop

### Implementation (@dnd-kit)

Project Hub uses **@dnd-kit** for accessible drag-and-drop functionality.

### DnD Setup

```tsx
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function Board() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement to activate drag
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Calculate new position and column
    await reorderTask({
      taskId: active.id,
      destinationColumnId: over.data.current.columnId,
      newPosition: over.data.current.position,
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {columns.map((column) => (
        <SortableContext
          key={column.id}
          items={tasks.filter(t => t.columnId === column.id)}
          strategy={verticalListSortingStrategy}
        >
          <Column column={column} tasks={tasks} />
        </SortableContext>
      ))}
    </DndContext>
  );
}
```

### Sortable Task

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  );
}
```

### Reorder API

```typescript
// API: POST /api/tasks/reorder
async function reorderTask(params: {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  newPosition: number;
}) {
  await apiClient.post('/api/tasks/reorder', params);
}
```

### Reorder Logic (Backend)

```typescript
// src/app/api/tasks/reorder/route.ts
export async function POST(req: Request) {
  const { taskId, destinationColumnId, newPosition } = await req.json();

  await db.transaction(async (tx) => {
    // 1. Update dragged task
    await tx
      .update(tasks)
      .set({
        columnId: destinationColumnId,
        position: newPosition,
      })
      .where(eq(tasks.id, taskId));

    // 2. Shift other tasks in destination column
    await tx
      .update(tasks)
      .set({
        position: sql`${tasks.position} + 1`,
      })
      .where(
        and(
          eq(tasks.columnId, destinationColumnId),
          gte(tasks.position, newPosition),
          ne(tasks.id, taskId)
        )
      );
  });

  return NextResponse.json({ success: true });
}
```

---

## Task Operations

### Create Task

```tsx
// Component
<AddTaskModal
  projectId={projectId}
  columnId={columnId}
  onSuccess={() => refetchTasks()}
/>

// API Call
await apiClient.post('/api/tasks', {
  name: 'New Task',
  description: 'Task description',
  projectId: 'uuid',
  columnId: 'uuid',
  status: 'todo',
  priority: 'medium',
  type: 'feature',
  deadline: '2024-01-31',
  assignedUserIds: ['uuid1', 'uuid2'],
});
```

### Update Task

```typescript
await apiClient.patch(`/api/tasks/${taskId}`, {
  name: 'Updated Name',
  status: 'in-progress',
  priority: 'high',
  hoursSpent: 8,
});
```

### Delete Task

```typescript
await apiClient.delete(`/api/tasks/${taskId}`);
```

### Task Filtering

```typescript
// Filter by status
const todoTasks = tasks.filter(t => t.status === 'todo');

// Filter by assignee
const myTasks = tasks.filter(t =>
  t.assignedUsers.some(u => u.id === currentUserId)
);

// Filter by priority
const urgentTasks = tasks.filter(t => t.priority === 'urgent');

// Filter by deadline (overdue)
const overdueTasks = tasks.filter(t =>
  t.deadline && new Date(t.deadline) < new Date()
);
```

---

## Task Comments

### Comment Structure

```typescript
interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: {
    name: string;
    image?: string;
  };
}
```

### List Comments

```typescript
const response = await apiClient.get(`/api/tasks/${taskId}/comments`);
const comments = response.data;
```

### Add Comment

```tsx
// Component
<TaskDetailModal taskId={taskId}>
  <CommentSection taskId={taskId} />
</TaskDetailModal>

// API Call
await apiClient.post(`/api/tasks/${taskId}/comments`, {
  content: 'This is a comment',
});
```

### Comment Display

```tsx
export function CommentList({ comments }: { comments: TaskComment[] }) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar>
            <AvatarImage src={comment.user.image} />
            <AvatarFallback>
              {comment.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{comment.user.name}</div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(comment.createdAt)} ago
            </div>
            <p className="mt-1">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Task Assignment

### Multiple Assignees

Tasks support multiple assignees via the `user_task_assignments` junction table.

### Assign Users

```typescript
// When creating task
await apiClient.post('/api/tasks', {
  name: 'New Task',
  // ...
  assignedUserIds: ['uuid1', 'uuid2', 'uuid3'],
});

// When updating task
await apiClient.patch(`/api/tasks/${taskId}`, {
  assignedUserIds: ['uuid1', 'uuid4'], // Replaces existing
});
```

### Display Assignees

```tsx
export function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Assignees */}
        <div className="flex -space-x-2">
          {task.assignedUsers.map((user) => (
            <Avatar key={user.id} className="border-2 border-background">
              <AvatarImage src={user.image} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Filter My Tasks

```typescript
const myTasks = tasks.filter((task) =>
  task.assignedUsers.some((user) => user.id === currentUserId)
);
```

---

## Implementation Details

### Task Card Component

```tsx
// src/components/mytask/task-card.tsx
export function TaskCard({ task }: { task: Task }) {
  const isPastDeadline =
    task.deadline && new Date(task.deadline) < new Date();

  return (
    <Card className={cn(
      "cursor-pointer hover:shadow-md transition-shadow",
      isPastDeadline && "border-red-500"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline">{task.shortId}</Badge>
            <CardTitle className="mt-2">{task.name}</CardTitle>
          </div>
          <Badge variant={getPriorityVariant(task.priority)}>
            {task.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Metadata */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Badge>{task.type}</Badge>
            {task.hoursSpent && (
              <Badge variant="secondary">
                {task.hoursSpent}h
              </Badge>
            )}
          </div>

          {/* Assignees */}
          <div className="flex -space-x-2">
            {task.assignedUsers.map((user) => (
              <Avatar key={user.id}>
                <AvatarImage src={user.image} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>

        {/* Deadline */}
        {task.deadline && (
          <div className={cn(
            "mt-2 text-sm flex items-center gap-1",
            isPastDeadline ? "text-red-500" : "text-muted-foreground"
          )}>
            <CalendarIcon className="h-4 w-4" />
            {format(new Date(task.deadline), 'MMM d, yyyy')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task Detail Modal

```tsx
// src/components/mytask/task-detail-modal.tsx
export function TaskDetailModal({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  async function fetchTask() {
    const response = await apiClient.get(`/api/tasks/${taskId}`);
    setTask(response.data);
  }

  return (
    <Dialog>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? (
              <Input
                value={task?.name}
                onChange={(e) => updateTask({ name: e.target.value })}
              />
            ) : (
              task?.name
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <TaskDetailsForm task={task} />
          </TabsContent>

          <TabsContent value="comments">
            <CommentSection taskId={taskId} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog taskId={taskId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Best Practices

### Performance

1. **Virtualization**: Use `react-window` for boards with 100+ tasks
2. **Pagination**: Load tasks in batches
3. **Debounce**: Debounce drag-and-drop updates
4. **Optimistic Updates**: Update UI immediately, sync with server

### UX Guidelines

1. **Visual Feedback**: Show drag state clearly
2. **Keyboard Navigation**: Support arrow keys for accessibility
3. **Undo/Redo**: Allow reverting drag operations
4. **Loading States**: Show skeletons while loading

### Code Organization

1. **Separate concerns**: Card presentation vs drag logic
2. **Reusable components**: TaskCard, Column, Board
3. **Type safety**: Use TypeScript interfaces
4. **Error handling**: Graceful fallbacks on API errors

---

## Related Documentation

- [API Routes](../api/routes-reference.md)
- [Database Schema](../database/schema.md)
- [Frontend Components](../frontend/components.md)

---

**Last Updated:** 2026-02-02
