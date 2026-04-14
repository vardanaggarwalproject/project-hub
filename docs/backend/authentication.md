# Authentication & Authorization Guide

> **Last Updated:** 2026-02-02
> **Auth Library:** Better Auth
> **Strategy:** Session-based authentication

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Setup](#authentication-setup)
3. [Authorization (RBAC)](#authorization-rbac)
4. [Route Protection](#route-protection)
5. [API Security](#api-security)
6. [User Roles](#user-roles)
7. [Session Management](#session-management)
8. [Password Reset Flow](#password-reset-flow)

---

## Overview

Project Hub uses **Better Auth** for authentication with a **session-based** approach. All passwords are hashed using bcrypt, and sessions are stored in HTTP-only cookies.

### Key Features

- Email/password authentication
- Session-based (no JWT)
- Role-based access control (RBAC)
- Password reset via email
- Secure HTTP-only cookies
- CSRF protection

---

## Authentication Setup

### Better Auth Configuration

Location: `src/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
```

### Environment Variables

Required in `.env`:

```bash
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

**Production:**
```bash
BETTER_AUTH_URL=https://yourdomain.com
```

---

## Authorization (RBAC)

### User Roles

Project Hub has **4 user roles**:

| Role | Access Level | Permissions |
|------|-------------|-------------|
| `admin` | Full | All features, user management, project creation |
| `developer` | Limited | Assigned projects, tasks, EODs, chat |
| `tester` | Limited | Assigned projects, tasks, EODs, chat |
| `designer` | Limited | Assigned projects, tasks, EODs, chat |

### Role Schema

Defined in `src/lib/db/schema.ts`:

```typescript
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 })
    .notNull()
    .unique(),
});

export const rolesEnum = pgEnum("user_role", [
  "admin",
  "developer",
  "tester",
  "designer",
]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: rolesEnum("role").notNull().default("developer"),
  // ... other fields
});
```

### Permission Matrix

| Feature | Admin | Developer | Tester | Designer |
|---------|-------|-----------|--------|----------|
| View own dashboard | ✅ | ✅ | ✅ | ✅ |
| View assigned projects | ✅ | ✅ | ✅ | ✅ |
| Create project | ✅ | ❌ | ❌ | ❌ |
| Edit project | ✅ | ❌ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ | ❌ |
| Assign users to project | ✅ | ❌ | ❌ | ❌ |
| Create task | ✅ | ✅ | ✅ | ✅ |
| Edit task | ✅ | ✅ | ✅ | ✅ |
| Delete task | ✅ | ✅ | ✅ | ✅ |
| Submit EOD | ✅ | ✅ | ✅ | ✅ |
| View all EODs | ✅ | ❌ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ | ❌ |
| Manage clients | ✅ | ❌ | ❌ | ❌ |
| Access admin routes | ✅ | ❌ | ❌ | ❌ |

---

## Route Protection

### Server Components

#### Admin Route Protection

Location: `src/app/admin/layout.tsx`

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is admin
  if (session.user.role !== "admin") {
    redirect("/user/dashboard");
  }

  return <>{children}</>;
}
```

#### User Route Protection

Location: `src/app/user/layout.tsx`

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

### Page-Level Protection

```typescript
// src/app/admin/projects/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    return <div>Access Denied</div>;
  }

  // ... rest of page
}
```

---

## API Security

### API Route Protection

Every protected API route should validate the session:

```typescript
// src/app/api/projects/route.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Validate session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check role if needed
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Process request
    const data = await fetchProjects();

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

### Row-Level Security

Filter data based on user role:

```typescript
// Admin sees all projects
if (session.user.role === "admin") {
  projects = await db.query.projects.findMany();
}
// Non-admin sees only assigned projects
else {
  projects = await db.query.projects.findMany({
    where: (projects, { inArray }) =>
      inArray(
        projects.id,
        db
          .select({ projectId: userProjectAssignments.projectId })
          .from(userProjectAssignments)
          .where(eq(userProjectAssignments.userId, session.user.id))
      ),
  });
}
```

---

## User Roles

### Default Admin Seeding

Script: `scripts/seed-admin.ts`

```bash
pnpm run seed-admin
```

Creates admin user:
- Email: admin@projecthub.com
- Password: admin123
- Role: admin

### Creating Users

#### Admin-Only User Creation

Endpoint: `POST /api/admin/create-user`

```typescript
const response = await fetch("/api/admin/create-user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    password: "SecurePass123!",
    role: "developer",
  }),
});
```

### Changing User Roles

Only admins can change user roles via the Users management page (`/admin/users`).

```typescript
// API: PATCH /api/users/[id]
await fetch(`/api/users/${userId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    role: "tester",
  }),
});
```

---

## Session Management

### Session Structure

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "developer" | "tester" | "designer";
    image?: string;
  };
  session: {
    token: string;
    expiresAt: Date;
  };
}
```

### Getting Current Session

#### Server Component

```typescript
import { auth } from "@/lib/auth";

const session = await auth();
console.log(session.user.email);
console.log(session.user.role);
```

#### Client Component

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isLoading } = useSession();

  if (isLoading) return <div>Loading...</div>;
  if (!session) return <div>Not logged in</div>;

  return <div>Welcome, {session.user.name}!</div>;
}
```

### Session Expiration

- **Default expiration**: 7 days
- **Auto-renewal**: Updates every 24 hours on activity
- **Cookie cache**: 5 minutes for performance

### Logout

```typescript
"use client";

import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

---

## Password Reset Flow

### Step 1: Request Reset

User enters email on `/forgot-password`:

```typescript
// POST /api/auth/forgot-password
await fetch("/api/auth/forgot-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
  }),
});
```

### Step 2: Email Sent

System sends email with reset token (valid for 1 hour).

### Step 3: Reset Password

User clicks link and enters new password on `/reset-password?token=xxx`:

```typescript
// POST /api/auth/reset-password
await fetch("/api/auth/reset-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "reset-token-from-email",
    password: "NewSecurePassword123!",
  }),
});
```

### Email Configuration

Better Auth uses Nodemailer for emails. Configure in `.env`:

```bash
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Security Best Practices

### 1. Password Requirements

Enforce strong passwords:
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

Validation with Zod:

```typescript
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain special character");
```

### 2. Rate Limiting

Implement rate limiting on auth endpoints:

```typescript
// Prevent brute force attacks
const rateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// In API route
await rateLimiter.check(req, 10, "LOGIN"); // 10 requests per minute
```

### 3. HTTPS Only

Production must use HTTPS:

```typescript
// next.config.ts
module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};
```

### 4. CSRF Protection

Better Auth includes built-in CSRF protection via:
- SameSite cookies
- CSRF tokens on state-changing requests

### 5. XSS Prevention

- React auto-escapes by default
- Sanitize user input
- Use Content Security Policy (CSP)

### 6. SQL Injection Prevention

- Use parameterized queries (Drizzle ORM handles this)
- Never concatenate SQL strings

---

## Common Auth Patterns

### Redirect After Login

```typescript
// src/app/(auth)/login/page.tsx
const handleLogin = async (data: LoginFormData) => {
  const result = await signIn.email({
    email: data.email,
    password: data.password,
    fetchOptions: {
      onSuccess: async () => {
        const session = await auth();
        if (session.user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/user/dashboard");
        }
      },
    },
  });
};
```

### Conditional Rendering by Role

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function AdminOnlyButton() {
  const { data: session } = useSession();

  if (session?.user.role !== "admin") {
    return null;
  }

  return <button>Admin Action</button>;
}
```

### Protecting Client Components

```typescript
"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedComponent() {
  const { data: session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login");
    }
  }, [session, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!session) return null;

  return <div>Protected Content</div>;
}
```

---

## Troubleshooting

### "Unauthorized" on Valid Session

**Cause:** Session cookie not being sent

**Solution:**
- Ensure `BETTER_AUTH_URL` matches your domain
- Check browser dev tools > Application > Cookies
- Verify `SameSite` and `Secure` attributes

### "Forbidden" on Admin Route

**Cause:** User role is not admin

**Solution:**
- Check user role in database
- Verify role check logic
- Clear cookies and re-login

### Password Reset Email Not Sent

**Cause:** SMTP configuration issue

**Solution:**
- Verify `SMTP_USER` and `SMTP_PASS` in `.env`
- Check Gmail "App Passwords" (if using Gmail)
- Review server logs for Nodemailer errors

---

## Related Documentation

- [API Routes Reference](../api/routes-reference.md)
- [Database Schema](../database/schema.md)
- [Frontend Components](../frontend/components.md)

---

**Security Contact:** Report security issues to your admin
**Last Updated:** 2026-02-02
