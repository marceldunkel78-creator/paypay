-- ==============================================
-- Migration Runner: Execute all migrations in correct order
-- Description: Ensures all migrations run in the proper dependency order
-- ==============================================

-- This script runs all migrations in the correct order to avoid FK constraint issues
-- Run this file to set up the complete database schema

-- Migration 001: Core tables (users, time_accounts)
SOURCE 001-init.sql;

-- Migration 002: Time entries (without task_id FK yet)
SOURCE 002-time-entries.sql;

-- Migration 003: Approval system extensions
SOURCE 003-approval-system.sql;

-- Migration 004: Household tasks (must come before 005)
SOURCE 004-household-tasks.sql;

-- Migration 005: Add task_id FK to time_entries (depends on household_tasks)
SOURCE 005-time-entries-task-id.sql;

-- Display completion message
SELECT 'All migrations completed successfully!' as Status;