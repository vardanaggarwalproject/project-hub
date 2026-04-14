-- Step 1: Add column as nullable first (for existing tasks)
ALTER TABLE "tasks" ADD COLUMN "short_id" text;--> statement-breakpoint

-- Step 2: Generate shortIds for existing tasks using a function
DO $$
DECLARE
    task_record RECORD;
    new_short_id text;
    id_exists boolean;
BEGIN
    FOR task_record IN SELECT id FROM tasks WHERE short_id IS NULL LOOP
        LOOP
            -- Generate a random 6-character alphanumeric ID
            new_short_id := 'PH-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

            -- Check if this ID already exists
            SELECT EXISTS(SELECT 1 FROM tasks WHERE short_id = new_short_id) INTO id_exists;

            -- If unique, exit loop
            EXIT WHEN NOT id_exists;
        END LOOP;

        -- Update the task with the new short_id
        UPDATE tasks SET short_id = new_short_id WHERE id = task_record.id;
    END LOOP;
END $$;--> statement-breakpoint

-- Step 3: Now make the column NOT NULL
ALTER TABLE "tasks" ALTER COLUMN "short_id" SET NOT NULL;--> statement-breakpoint

-- Step 4: Add unique constraint and index
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_short_id_unique" UNIQUE("short_id");--> statement-breakpoint
CREATE INDEX "tasks_short_id_idx" ON "tasks" USING btree ("short_id");