-- ==============================================
-- Migration 003: Approval System
-- Description: Adds approval workflow to time entries
-- ==============================================

-- Add approval fields to time_entries table
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS approved_by INT NULL;

-- Add foreign key constraint for approved_by field
ALTER TABLE time_entries 
ADD CONSTRAINT IF NOT EXISTS fk_approved_by 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for better performance on status queries
ALTER TABLE time_entries 
ADD INDEX IF NOT EXISTS idx_status (status),
ADD INDEX IF NOT EXISTS idx_user_status (user_id, status),
ADD INDEX IF NOT EXISTS idx_approved_by (approved_by);