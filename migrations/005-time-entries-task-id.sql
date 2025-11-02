-- ==============================================
-- Migration 005: Link Time Entries to Household Tasks
-- Description: Adds task_id column to link time entries with household tasks
-- Prerequisite: household_tasks table must exist (Migration 004)
-- ==============================================

-- Check if household_tasks table exists before proceeding
-- Add task_id column to time_entries table for linking to household tasks
ALTER TABLE time_entries 
ADD COLUMN task_id INT NULL AFTER user_id;

-- Add foreign key constraint to household_tasks table
-- This will only work if household_tasks table exists
ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_task_id 
    FOREIGN KEY (task_id) REFERENCES household_tasks(id) 
    ON DELETE SET NULL;

-- Add index for better performance on task queries
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);