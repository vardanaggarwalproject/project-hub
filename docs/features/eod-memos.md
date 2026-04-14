# EOD Reports & Memos System

> **Last Updated:** 2026-02-02
> **Feature:** Daily reporting and memo system
> **Purpose:** Track daily progress and updates

---

## Table of Contents

1. [Overview](#overview)
2. [EOD Reports](#eod-reports)
3. [Memos](#memos)
4. [Submission Flow](#submission-flow)
5. [Weekly View](#weekly-view)
6. [Missing Updates Tracking](#missing-updates-tracking)
7. [Notifications](#notifications)
8. [Implementation Details](#implementation-details)

---

## Overview

The **EOD (End of Day) Reports** and **Memos** system enables daily progress tracking for all projects and team members.

### Key Features

- ✅ **Dual updates** - Client-facing and internal updates
- ✅ **Auto-upsert** - Updates existing report for same date
- ✅ **Duplicate prevention** - One report per user/project/date
- ✅ **Weekly view** - Calendar-based visualization
- ✅ **Missing updates** - Admin dashboard tracking
- ✅ **Multi-channel notifications** - Email, Push, In-App, Slack
- ✅ **Memo types** - Short (project-specific) and Universal (general)
- ✅ **Time tracking integration** - Links with task hours

---

## EOD Reports

### What is an EOD Report?

An **End of Day (EOD) Report** is a daily summary of work completed on a specific project.

### Report Structure

```typescript
interface EODReport {
  id: string;
  userId: string;              // Who submitted
  projectId: string;           // Which project
  reportDate: string;          // Date (YYYY-MM-DD)
  clientUpdate: string;        // Public update for client
  actualUpdate: string;        // Internal update for team
  createdAt: Date;
  updatedAt: Date;
}
```

### Two Types of Updates

#### 1. Client Update (Public)

Polished, client-facing summary:

**Example:**
> "Completed the user authentication module. All login and registration flows are now functional. Started work on the dashboard layout design."

**Characteristics:**
- Professional tone
- No technical jargon
- Highlights completed work
- Shared with clients

#### 2. Actual Update (Internal)

Detailed, technical notes for internal team:

**Example:**
> "Implemented JWT authentication with refresh tokens. Fixed bug in password reset flow. Dashboard layout blocked by pending API endpoints. Need to discuss navigation structure with team tomorrow."

**Characteristics:**
- Technical details
- Blockers and challenges
- Internal notes
- Only visible to admins

### Database Schema

```sql
CREATE TABLE eod_reports (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  report_date DATE NOT NULL,
  client_update TEXT NOT NULL,
  actual_update TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, project_id, report_date)
);
```

**Key Constraint:** `UNIQUE(user_id, project_id, report_date)` prevents duplicate submissions.

### Creating/Updating EOD

#### API Endpoint

```http
POST /api/eods
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "reportDate": "2024-01-15",
  "clientUpdate": "Completed user authentication module...",
  "actualUpdate": "Implemented JWT auth with refresh tokens..."
}
```

**Behavior:**
- If EOD exists for same `(userId, projectId, reportDate)` → **UPDATE**
- Otherwise → **CREATE**

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "projectId": "uuid",
    "reportDate": "2024-01-15",
    "clientUpdate": "...",
    "actualUpdate": "...",
    "createdAt": "2024-01-15T18:30:00Z",
    "updatedAt": "2024-01-15T18:30:00Z"
  }
}
```

### UI Components

#### EOD Submission Modal

Location: `src/components/dashboard/update-modal.tsx`

```tsx
<UpdateModal
  projectId={project.id}
  projectName={project.name}
  reportDate={new Date()}
  onSuccess={refetch}
/>
```

**Features:**
- Two text areas (client update, actual update)
- Character counter
- Auto-save draft (localStorage)
- Submit/Update button
- Validation (both fields required)

#### EOD History

Location: `src/app/admin/eods/page.tsx` or `src/app/user/eods/page.tsx`

```tsx
<EODHistory
  userId={currentUser.id}  // Optional: filter by user
  projectId={selectedProjectId}  // Optional: filter by project
  fromDate="2024-01-01"
  toDate="2024-01-31"
/>
```

Displays:
- Date
- Project name
- User name
- Client update
- Actual update (admin only)
- Edit/Delete buttons

---

## Memos

### What is a Memo?

A **Memo** is a short (140 characters), concise daily update.

### Memo Types

#### 1. Short Memo (Project-Specific)

Brief update for a specific project.

**Example:**
> "Fixed critical bug in checkout flow, deployed to staging"

#### 2. Universal Memo (General)

General update not tied to specific project.

**Example:**
> "Attended team meeting, reviewed PRs, helped onboard new developer"

### Memo Structure

```typescript
interface Memo {
  id: string;
  userId: string;
  projectId: string;           // Null for universal memos
  reportDate: string;
  memoContent: string;         // Max 140 characters
  memoType: 'short' | 'universal';
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Schema

```sql
CREATE TABLE memos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user(id),
  project_id UUID REFERENCES projects(id),  -- Nullable
  report_date DATE NOT NULL,
  memo_content VARCHAR(140) NOT NULL,
  memo_type VARCHAR(20) NOT NULL,  -- 'short' or 'universal'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, project_id, report_date, memo_type)
);
```

### Creating Memos

#### API Endpoint

```http
POST /api/memos
```

**Single Memo:**
```json
{
  "projectId": "uuid",
  "reportDate": "2024-01-15",
  "memoContent": "Fixed critical bug in checkout",
  "memoType": "short"
}
```

**Bulk Memos:**
```json
{
  "memos": [
    {
      "projectId": "uuid1",
      "reportDate": "2024-01-15",
      "memoContent": "Completed authentication module",
      "memoType": "short"
    },
    {
      "projectId": "uuid2",
      "reportDate": "2024-01-15",
      "memoContent": "Started dashboard design",
      "memoType": "short"
    },
    {
      "projectId": null,
      "reportDate": "2024-01-15",
      "memoContent": "Attended team standup",
      "memoType": "universal"
    }
  ]
}
```

### Memo Validation

```typescript
const memoSchema = z.object({
  projectId: z.string().uuid().nullable(),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memoContent: z.string().min(1).max(140),
  memoType: z.enum(['short', 'universal']),
});
```

### Required Memos

Projects have a `isMemoRequired` boolean flag:

```typescript
// If project.isMemoRequired === true
// User MUST submit memo daily for that project
```

Admin can toggle this in project settings.

---

## Submission Flow

### Complete Daily Update Flow

1. **User navigates to dashboard**
2. **Sees projects requiring updates**
3. **Clicks "Submit Update" button**
4. **Modal opens with tabs:**
   - EOD Report tab
   - Memo tab
5. **User fills out both forms**
6. **Submits (one API call per form)**
7. **Notifications sent to admins**
8. **Dashboard refreshes**

### Update Modal Component

```tsx
export function UpdateModal({ projectId, projectName, reportDate }) {
  const [activeTab, setActiveTab] = useState<'eod' | 'memo'>('eod');

  return (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Daily Update - {projectName}</DialogTitle>
          <DialogDescription>
            {format(reportDate, 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="eod">EOD Report</TabsTrigger>
            <TabsTrigger value="memo">Memo</TabsTrigger>
          </TabsList>

          <TabsContent value="eod">
            <EODForm
              projectId={projectId}
              reportDate={reportDate}
              onSuccess={handleSuccess}
            />
          </TabsContent>

          <TabsContent value="memo">
            <MemoForm
              projectId={projectId}
              reportDate={reportDate}
              onSuccess={handleSuccess}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Auto-save Draft

```typescript
// Save to localStorage while typing
useEffect(() => {
  const draftKey = `eod-draft-${projectId}-${reportDate}`;
  localStorage.setItem(draftKey, JSON.stringify({ clientUpdate, actualUpdate }));
}, [clientUpdate, actualUpdate, projectId, reportDate]);

// Load draft on mount
useEffect(() => {
  const draftKey = `eod-draft-${projectId}-${reportDate}`;
  const draft = localStorage.getItem(draftKey);
  if (draft) {
    const { clientUpdate, actualUpdate } = JSON.parse(draft);
    setClientUpdate(clientUpdate);
    setActualUpdate(actualUpdate);
  }
}, [projectId, reportDate]);

// Clear draft after successful submission
const handleSubmit = async () => {
  await apiClient.post('/api/eods', data);
  localStorage.removeItem(`eod-draft-${projectId}-${reportDate}`);
};
```

---

## Weekly View

### Calendar-Based Visualization

Displays EODs/Memos for a week in calendar format.

#### Weekly View Component

Location: `src/components/eods/weekly-view.tsx`

```tsx
<WeeklyEODView
  userId={currentUser.id}
  startDate={weekStartDate}
  endDate={weekEndDate}
/>
```

**Display:**
```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │   Sat   │   Sun   │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ ✅ EOD  │ ✅ EOD  │ ✅ EOD  │ ❌ EOD  │ ✅ EOD  │ Weekend │ Weekend │
│ ✅ Memo │ ✅ Memo │ ❌ Memo │ ❌ Memo │ ✅ Memo │ Skipped │ Skipped │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

#### API Endpoint

```http
GET /api/eods/weekly?userId=uuid&startDate=2024-01-15&endDate=2024-01-21
```

**Response:**
```json
{
  "data": {
    "2024-01-15": {
      "eods": [ /* EOD objects */ ],
      "memos": [ /* Memo objects */ ]
    },
    "2024-01-16": {
      "eods": [],
      "memos": [ /* Memo objects */ ]
    }
    // ... for each day
  }
}
```

#### Implementation

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const eods = await db
    .select()
    .from(eodReports)
    .where(
      and(
        eq(eodReports.userId, userId),
        gte(eodReports.reportDate, startDate),
        lte(eodReports.reportDate, endDate)
      )
    );

  const memos = await db
    .select()
    .from(memos)
    .where(
      and(
        eq(memos.userId, userId),
        gte(memos.reportDate, startDate),
        lte(memos.reportDate, endDate)
      )
    );

  // Group by date
  const grouped = {};
  eods.forEach((eod) => {
    if (!grouped[eod.reportDate]) grouped[eod.reportDate] = { eods: [], memos: [] };
    grouped[eod.reportDate].eods.push(eod);
  });
  memos.forEach((memo) => {
    if (!grouped[memo.reportDate]) grouped[memo.reportDate] = { eods: [], memos: [] };
    grouped[memo.reportDate].memos.push(memo);
  });

  return NextResponse.json({ data: grouped });
}
```

---

## Missing Updates Tracking

### Admin Dashboard Tracking

Admins can see who hasn't submitted EODs/Memos.

#### Missing Updates Component

Location: `src/components/dashboard/missing-updates-section.tsx`

```tsx
<MissingUpdatesSection date={new Date()} />
```

**Displays:**
- Users who didn't submit EOD for active projects
- Users who didn't submit Memo for memo-required projects
- Grouped by project
- Color-coded by severity (1 day overdue, 2+ days overdue)

#### Calculation Logic

```typescript
async function getMissingUpdates(date: Date) {
  // Get all active user-project assignments
  const assignments = await db
    .select()
    .from(userProjectAssignments)
    .where(eq(userProjectAssignments.isActive, true));

  // Get EODs for that date
  const eods = await db
    .select()
    .from(eodReports)
    .where(eq(eodReports.reportDate, date));

  // Find missing
  const missing = assignments.filter((assignment) => {
    return !eods.some(
      (eod) =>
        eod.userId === assignment.userId &&
        eod.projectId === assignment.projectId
    );
  });

  return missing;
}
```

#### Weekend Skip

Weekends (Saturday, Sunday) are automatically skipped:

```typescript
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// In calculation
if (isWeekend(checkDate)) {
  continue; // Skip this date
}
```

---

## Notifications

### When Notifications are Sent

1. **EOD Submitted** → Notify admins
2. **Memo Submitted** → Notify admins
3. **Missing EOD (end of day)** → Notify user (reminder)
4. **Missing Memo (end of day)** → Notify user (reminder)

### Notification Trigger

```typescript
// After EOD submission
await sendNotification({
  event: 'eod_submitted',
  data: {
    userId: session.user.id,
    userName: session.user.name,
    projectId: data.projectId,
    projectName: project.name,
    reportDate: data.reportDate,
    clientUpdate: data.clientUpdate,
  },
  recipients: await getAdminEmails(),
});
```

### Email Template (EOD Submission)

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background: #3b82f6; color: white; padding: 20px; }
      .content { padding: 20px; background: #f9fafb; }
      .quote { border-left: 4px solid #3b82f6; padding-left: 16px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📝 EOD Report Submitted</h1>
      </div>
      <div class="content">
        <p><strong>Developer:</strong> {{ userName }}</p>
        <p><strong>Project:</strong> {{ projectName }}</p>
        <p><strong>Date:</strong> {{ reportDate }}</p>

        <h3>Client Update:</h3>
        <div class="quote">{{ clientUpdate }}</div>

        <p style="margin-top: 30px;">
          <a href="{{ appUrl }}/admin/eods" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Full Report
          </a>
        </p>
      </div>
    </div>
  </body>
</html>
```

---

## Implementation Details

### EOD History Page

```tsx
// src/app/admin/eods/page.tsx
export default async function EODsPage() {
  const session = await auth();
  const eods = await db
    .select({
      id: eodReports.id,
      reportDate: eodReports.reportDate,
      clientUpdate: eodReports.clientUpdate,
      actualUpdate: eodReports.actualUpdate,
      userName: user.name,
      projectName: projects.name,
    })
    .from(eodReports)
    .innerJoin(user, eq(eodReports.userId, user.id))
    .innerJoin(projects, eq(eodReports.projectId, projects.id))
    .orderBy(desc(eodReports.reportDate));

  return (
    <div>
      <h1>EOD Reports</h1>
      <DataTable
        columns={eodColumns}
        data={eods}
        searchKey="userName"
      />
    </div>
  );
}
```

### EOD Form with Validation

```tsx
const formSchema = z.object({
  projectId: z.string().uuid(),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clientUpdate: z.string().min(10, 'Client update must be at least 10 characters'),
  actualUpdate: z.string().min(10, 'Actual update must be at least 10 characters'),
});

export function EODForm({ projectId, reportDate, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId,
      reportDate: format(reportDate, 'yyyy-MM-dd'),
      clientUpdate: '',
      actualUpdate: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await apiClient.post('/api/eods', data);
      toast.success('EOD report submitted successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to submit EOD report');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="clientUpdate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Update</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What did you accomplish today?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actualUpdate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Update</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Technical details, blockers, etc."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit EOD Report</Button>
      </form>
    </Form>
  );
}
```

---

## Best Practices

### For Users

1. **Submit daily** - Don't wait till end of week
2. **Be specific** - Mention concrete achievements
3. **Include blockers** - Note any impediments in actual update
4. **Proofread** - Especially client updates
5. **Use memo** - For quick updates when short on time

### For Admins

1. **Review regularly** - Check missing updates daily
2. **Follow up** - Reach out to users who miss updates
3. **Provide feedback** - Give constructive feedback on updates
4. **Set expectations** - Clarify what makes a good update
5. **Adjust requirements** - Toggle `isMemoRequired` based on project needs

### Code Guidelines

1. **Validate dates** - Ensure proper format (YYYY-MM-DD)
2. **Handle duplicates** - Use upsert logic
3. **Skip weekends** - Don't penalize for weekend non-submission
4. **Batch notifications** - Don't send notification for every update
5. **Cache lookups** - Cache active projects per user

---

## Related Documentation

- [Notification System](./notifications.md)
- [API Routes](../api/routes-reference.md)
- [Database Schema](../database/schema.md)
- [Dashboard Components](../frontend/components.md)

---

**Last Updated:** 2026-02-02
