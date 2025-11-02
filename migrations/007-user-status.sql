-- Migration: Add status field to users table for user management
-- Status: 'active' (approved and active), 'pending' (waiting for admin approval), 'suspended' (temporarily disabled)

ALTER TABLE users ADD COLUMN status ENUM('active', 'pending', 'suspended') DEFAULT 'pending';

-- Update existing users to 'active' status (they were already approved)
UPDATE users SET status = 'active' WHERE status = 'pending';

-- Create index for better performance on status queries
CREATE INDEX idx_users_status ON users(status);