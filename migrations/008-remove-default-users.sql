-- Migration: Remove default users and setup clean admin management
-- This migration removes the default test users created in 001-init.sql

-- Remove default test users (they have placeholder passwords anyway)
DELETE FROM users WHERE username IN ('admin1', 'admin2', 'user1');

-- Note: Use the create-admin.js script to create a proper admin user with a secure password
-- Run: node scripts/create-admin.js