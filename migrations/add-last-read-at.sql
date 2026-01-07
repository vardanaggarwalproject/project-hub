-- Migration: Add last_read_at column to user_project_assignments table
-- This column is required for tracking when users last read messages in a project

ALTER TABLE user_project_assignments 
ADD COLUMN IF NOT EXISTS last_read_at timestamp without time zone DEFAULT NOW() NOT NULL;

-- Update existing rows to have a default value (current time)
UPDATE user_project_assignments 
SET last_read_at = NOW() 
WHERE last_read_at IS NULL;
