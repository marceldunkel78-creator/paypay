-- Migration: Add email field to users table
-- Description: Adds email column for proper email notifications

ALTER TABLE users 
ADD COLUMN email VARCHAR(255) UNIQUE AFTER username;

-- Update existing users with placeholder emails (replace with real emails later)
UPDATE users SET email = CONCAT(username, '@example.com') WHERE email IS NULL;

-- Add index for better performance
CREATE INDEX idx_users_email ON users(email);