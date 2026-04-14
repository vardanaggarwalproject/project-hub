# Development Setup Guide

> **Last Updated:** 2026-02-02
> **Prerequisites:** Node.js 18+, pnpm, PostgreSQL
> **Platform:** Cross-platform (Windows, macOS, Linux)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Database Migrations](#database-migrations)
7. [Seeding Data](#seeding-data)
8. [Development Tools](#development-tools)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 18+ | https://nodejs.org/ |
| pnpm | Latest | `npm install -g pnpm` |
| PostgreSQL | 14+ | https://www.postgresql.org/ OR use Supabase |
| Git | Latest | https://git-scm.com/ |

### Optional Tools

- **VS Code** - Recommended IDE
- **Drizzle Studio** - Database GUI (included)
- **Postman** - API testing
- **ngrok** - Webhook testing

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/project-hub.git
cd project-hub
```

### 2. Install Dependencies

```bash
pnpm install
```

**Note:** Project uses pnpm workspaces. Don't use npm or yarn.

### 3. Verify Installation

```bash
pnpm --version
node --version
```

Expected output:
```
8.x.x (pnpm)
v18.x.x (node)
```

---

## Database Setup

### Option 1: Supabase (Recommended)

#### Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Wait for database provisioning (~2 minutes)
4. Get connection strings:
   - Go to Settings → Database
   - Copy **Connection Pooling** (for `DATABASE_URL`)
   - Copy **Direct Connection** (for `DIRECT_URL`)

#### Connection String Format

```
# Pooler (for app connections)
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct (for migrations)
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Option 2: Local PostgreSQL

#### Install PostgreSQL

**Windows:**
```bash
# Download installer from postgresql.org
# OR use Chocolatey
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE project_hub;

# Create user (optional)
CREATE USER project_hub_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE project_hub TO project_hub_user;

# Exit
\q
```

#### Connection String

```
postgresql://postgres:your_password@localhost:5432/project_hub
```

---

## Environment Variables

### Create `.env` File

Copy from template:

```bash
cp .env.example .env
```

OR create manually:

```bash
# .env

# Database (Supabase)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# Push Notifications (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-vapid-key
VAPID_PRIVATE_KEY=your-private-vapid-key
VAPID_SUBJECT=mailto:your-email@example.com

# Email (Gmail SMTP)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX

# Cloudinary (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generate Secrets

#### BETTER_AUTH_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key: BKxN...
Private Key: aB3d...
```

### Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App passwords
4. Generate password for "Mail"
5. Copy to `SMTP_PASS`

---

## Running the Application

### Development Mode

```bash
pnpm dev
```

Server starts on: http://localhost:3000

**Note:** Uses custom `server.js` for Socket.IO integration.

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Other Scripts

```bash
# Lint code
pnpm lint

# Type check
pnpm type-check

# Format code (if Prettier configured)
pnpm format
```

---

## Database Migrations

### Overview

Project uses **Drizzle ORM** for database schema management.

### Generate Migration

After changing `src/lib/db/schema.ts`:

```bash
pnpm run generate
```

This creates a new migration file in `drizzle/migrations/`.

### Apply Migrations

```bash
pnpm run migrate
```

This runs all pending migrations against your database.

### Migration Files

```
drizzle/
├── migrations/
│   ├── 0000_initial_schema.sql
│   ├── 0001_add_hours_spent.sql
│   ├── 0002_add_task_columns.sql
│   └── meta/
│       └── _journal.json
```

### View Migration Status

```bash
pnpm drizzle-kit studio
```

Opens Drizzle Studio on http://localhost:4983

### Rollback (Manual)

Drizzle doesn't support automatic rollback. Create a new migration to undo changes.

```typescript
// Example: Undo adding a column
await db.schema.alterTable('tasks').dropColumn('newColumn');
```

---

## Seeding Data

### Seed Admin User

Creates default admin account:

```bash
pnpm run seed-admin
```

**Credentials:**
- Email: admin@projecthub.com
- Password: admin123
- Role: admin

**⚠️ Change password after first login in production!**

### Seed Default Columns

Creates default Kanban columns:

```bash
pnpm run seed-columns
```

Creates:
1. Backlog (gray)
2. To Do (blue)
3. In Progress (yellow)
4. In Review (purple)
5. Done (green)

### Custom Seed Script

Create `scripts/seed.ts`:

```typescript
import { db } from '@/lib/db';
import { clients, projects, user } from '@/lib/db/schema';

async function seed() {
  // Create test client
  const [client] = await db
    .insert(clients)
    .values({
      name: 'Test Client',
      email: 'client@example.com',
    })
    .returning();

  // Create test project
  await db.insert(projects).values({
    name: 'Test Project',
    clientId: client.id,
    status: 'active',
  });

  console.log('Seed completed!');
}

seed().catch(console.error);
```

Run:
```bash
tsx scripts/seed.ts
```

---

## Development Tools

### Drizzle Studio

Visual database editor:

```bash
pnpm run db:studio
```

Opens on: http://localhost:4983

Features:
- View all tables
- Edit data inline
- Run queries
- View relationships

### VSCode Extensions

Recommended extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

Install:
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
```

### ESLint Configuration

Check for issues:

```bash
pnpm lint
```

Fix auto-fixable issues:

```bash
pnpm lint --fix
```

### TypeScript Type Checking

```bash
pnpm type-check
```

OR in watch mode:

```bash
pnpm type-check --watch
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# OR change port
PORT=3001 pnpm dev
```

### Database Connection Failed

**Error:** `Connection terminated unexpectedly`

**Solutions:**

1. **Check connection string:**
   ```bash
   echo $DATABASE_URL  # macOS/Linux
   echo %DATABASE_URL%  # Windows
   ```

2. **Test connection:**
   ```bash
   psql $DATABASE_URL
   ```

3. **Verify database exists:**
   ```sql
   \l  # List databases in psql
   ```

4. **Check firewall:** Ensure PostgreSQL port (5432) is open

### Migration Errors

**Error:** `relation "xyz" does not exist`

**Solution:**

1. Drop all tables:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

2. Re-run migrations:
   ```bash
   pnpm run migrate
   ```

### Module Not Found

**Error:** `Cannot find module '@/lib/db'`

**Solution:**

1. Check `tsconfig.json` paths:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. Restart TypeScript server (VS Code: `Cmd+Shift+P` → "Restart TS Server")

### Socket.IO Not Working

**Error:** `io is not defined`

**Solution:**

1. Ensure using custom server:
   ```bash
   # Check package.json
   "dev": "node server.js"
   ```

2. Verify server.js exists in root

3. Check socket connection:
   ```typescript
   const socket = getSocket();
   console.log('Socket connected:', socket.connected);
   ```

### Email Not Sending

**Solutions:**

1. **Verify SMTP credentials:**
   ```bash
   echo $SMTP_USER
   echo $SMTP_PASS
   ```

2. **Test with curl:**
   ```bash
   curl -v smtps://smtp.gmail.com:465 --user "your-email@gmail.com:your-app-password"
   ```

3. **Check Gmail settings:**
   - 2FA enabled
   - App password generated (not regular password)

### Push Notifications Not Working

**Solutions:**

1. **Check VAPID keys:**
   ```bash
   echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY
   echo $VAPID_PRIVATE_KEY
   ```

2. **Verify HTTPS (required for push):**
   - Use ngrok for local testing:
     ```bash
     ngrok http 3000
     ```

3. **Check browser permissions:**
   ```javascript
   Notification.permission // should be "granted"
   ```

### pnpm Install Fails

**Error:** `ENOENT: no such file or directory`

**Solution:**

1. Clear pnpm cache:
   ```bash
   pnpm store prune
   ```

2. Delete node_modules and pnpm-lock.yaml:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. Check Node version:
   ```bash
   node --version  # Should be 18+
   ```

---

## Development Workflow

### Recommended Flow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes**

3. **Run type check:**
   ```bash
   pnpm type-check
   ```

4. **Run linter:**
   ```bash
   pnpm lint
   ```

5. **Test locally:**
   ```bash
   pnpm dev
   ```

6. **Commit:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

7. **Push:**
   ```bash
   git push origin feature/new-feature
   ```

### Commit Message Convention

Follow Conventional Commits:

```
feat: add new feature
fix: resolve bug in authentication
docs: update README
style: format code
refactor: restructure components
test: add unit tests
chore: update dependencies
```

---

## Next Steps

After setup is complete:

1. ✅ Login with admin account
2. ✅ Create a test client
3. ✅ Create a test project
4. ✅ Create test users
5. ✅ Assign users to projects
6. ✅ Create tasks
7. ✅ Test chat
8. ✅ Submit EOD/Memo
9. ✅ Configure notifications

---

## Related Documentation

- [Database Schema](../database/schema.md)
- [API Routes](../api/routes-reference.md)
- [Architecture Overview](../architecture/overview.md)
- [Deployment Guide](./deployment.md)

---

**Need Help?**
- Check [Troubleshooting](#troubleshooting)
- Review [GitHub Issues](https://github.com/yourusername/project-hub/issues)
- Contact dev team

**Last Updated:** 2026-02-02
