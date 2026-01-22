-- Migration: Add task columns table and enhance tasks table
-- Created: 2026-01-21
-- Purpose: Add column management and task ordering for Kanban board

-- ============================================================================
-- 1. Create task_columns table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "task_columns" (
    "id" text PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "color" text DEFAULT '#6B7280',
    "position" integer NOT NULL,
    "project_id" text,
    "user_id" text,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign keys for task_columns
DO $$ BEGIN
    ALTER TABLE "task_columns" ADD CONSTRAINT "task_columns_project_id_projects_id_fk"
        FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "task_columns" ADD CONSTRAINT "task_columns_user_id_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add indexes for task_columns
CREATE INDEX IF NOT EXISTS "task_columns_project_id_idx" ON "task_columns" ("project_id");
CREATE INDEX IF NOT EXISTS "task_columns_user_id_idx" ON "task_columns" ("user_id");
CREATE INDEX IF NOT EXISTS "task_columns_position_idx" ON "task_columns" ("position");

-- ============================================================================
-- 2. Seed default columns
-- ============================================================================

INSERT INTO "task_columns" ("id", "title", "color", "position", "is_default")
SELECT
    gen_random_uuid()::text,
    'To Do',
    '#3B82F6',
    0,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM "task_columns" WHERE "title" = 'To Do' AND "is_default" = true
);

INSERT INTO "task_columns" ("id", "title", "color", "position", "is_default")
SELECT
    gen_random_uuid()::text,
    'In Progress',
    '#F59E0B',
    1,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM "task_columns" WHERE "title" = 'In Progress' AND "is_default" = true
);

INSERT INTO "task_columns" ("id", "title", "color", "position", "is_default")
SELECT
    gen_random_uuid()::text,
    'Complete',
    '#10B981',
    2,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM "task_columns" WHERE "title" = 'Complete' AND "is_default" = true
);

-- ============================================================================
-- 3. Enhance tasks table
-- ============================================================================

-- Add priority column (low, medium, high)
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium';

-- Add column_id to link tasks to columns
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "column_id" text;

-- Add position for task ordering within columns
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0;

-- Add type for future categorization (bug, feature, enhancement, etc.)
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "type" text;

-- Add foreign key for column_id
DO $$ BEGIN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_task_columns_id_fk"
        FOREIGN KEY ("column_id") REFERENCES "task_columns"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add indexes for tasks
CREATE INDEX IF NOT EXISTS "tasks_column_id_idx" ON "tasks" ("column_id");
CREATE INDEX IF NOT EXISTS "tasks_position_idx" ON "tasks" ("position");
CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "tasks" ("priority");
CREATE INDEX IF NOT EXISTS "tasks_type_idx" ON "tasks" ("type");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");

-- ============================================================================
-- 4. Migrate existing tasks to default columns (if any exist)
-- ============================================================================

-- Map status 'todo' to 'To Do' column
UPDATE "tasks"
SET "column_id" = (SELECT "id" FROM "task_columns" WHERE "title" = 'To Do' AND "is_default" = true LIMIT 1)
WHERE "status" = 'todo' AND "column_id" IS NULL;

-- Map status 'in_progress' to 'In Progress' column
UPDATE "tasks"
SET "column_id" = (SELECT "id" FROM "task_columns" WHERE "title" = 'In Progress' AND "is_default" = true LIMIT 1)
WHERE "status" = 'in_progress' AND "column_id" IS NULL;

-- Map status 'done' to 'Complete' column
UPDATE "tasks"
SET "column_id" = (SELECT "id" FROM "task_columns" WHERE "title" = 'Complete' AND "is_default" = true LIMIT 1)
WHERE "status" = 'done' AND "column_id" IS NULL;

-- Set default column for tasks with NULL status
UPDATE "tasks"
SET "column_id" = (SELECT "id" FROM "task_columns" WHERE "title" = 'To Do' AND "is_default" = true LIMIT 1)
WHERE "column_id" IS NULL;

-- Set position based on created_at (older tasks first)
WITH ranked_tasks AS (
    SELECT
        "id",
        "column_id",
        ROW_NUMBER() OVER (PARTITION BY "column_id" ORDER BY "created_at") - 1 AS new_position
    FROM "tasks"
    WHERE "column_id" IS NOT NULL
)
UPDATE "tasks"
SET "position" = ranked_tasks.new_position
FROM ranked_tasks
WHERE "tasks"."id" = ranked_tasks."id";

-- ============================================================================
-- 5. Rollback script (comment out, save for reference)
-- ============================================================================

-- DROP INDEX IF EXISTS "tasks_status_idx";
-- DROP INDEX IF EXISTS "tasks_type_idx";
-- DROP INDEX IF EXISTS "tasks_priority_idx";
-- DROP INDEX IF EXISTS "tasks_position_idx";
-- DROP INDEX IF EXISTS "tasks_column_id_idx";
-- ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_column_id_task_columns_id_fk";
-- ALTER TABLE "tasks" DROP COLUMN IF EXISTS "type";
-- ALTER TABLE "tasks" DROP COLUMN IF EXISTS "position";
-- ALTER TABLE "tasks" DROP COLUMN IF EXISTS "column_id";
-- ALTER TABLE "tasks" DROP COLUMN IF EXISTS "priority";
-- DROP INDEX IF EXISTS "task_columns_position_idx";
-- DROP INDEX IF EXISTS "task_columns_user_id_idx";
-- DROP INDEX IF EXISTS "task_columns_project_id_idx";
-- ALTER TABLE "task_columns" DROP CONSTRAINT IF EXISTS "task_columns_user_id_user_id_fk";
-- ALTER TABLE "task_columns" DROP CONSTRAINT IF EXISTS "task_columns_project_id_projects_id_fk";
-- DROP TABLE IF EXISTS "task_columns";
