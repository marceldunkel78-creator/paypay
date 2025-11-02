-- ==============================================
-- PayPay Database Update - Incremental Migration
-- Description: Updates existing installations to latest schema
-- Version: 1.0
-- Use this for existing databases that need updates
-- ==============================================

-- Check if we need to run migrations
SELECT 'Starting incremental migration...' AS Status;

-- ==============================================
-- MIGRATION 001: Core tables (if not exists)
-- ==============================================

-- Users table updates
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD INDEX IF NOT EXISTS idx_email (email),
ADD INDEX IF NOT EXISTS idx_approved (is_approved);

-- ==============================================
-- MIGRATION 002: Time entries (if not exists)
-- ==============================================

-- Create time_entries if it doesn't exist
CREATE TABLE IF NOT EXISTS time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    entry_type ENUM('productive', 'screen_time') NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_entry_type (entry_type),
    INDEX idx_created (created_at)
);

-- Create user_time_balance if it doesn't exist
CREATE TABLE IF NOT EXISTS user_time_balance (
    user_id INT PRIMARY KEY,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- MIGRATION 003: Approval system
-- ==============================================

-- Add approval fields to time_entries
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS approved_by INT NULL,
ADD INDEX IF NOT EXISTS idx_status (status),
ADD INDEX IF NOT EXISTS idx_user_status (user_id, status),
ADD INDEX IF NOT EXISTS idx_approved_by (approved_by);

-- Add foreign key for approved_by (only if it doesn't exist)
SET @constraint_exists = 0;
SELECT COUNT(*) INTO @constraint_exists 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'time_entries' 
  AND CONSTRAINT_NAME = 'fk_approved_by';

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE time_entries ADD CONSTRAINT fk_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "Foreign key fk_approved_by already exists" AS Info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==============================================
-- MIGRATION 004: Household tasks
-- ==============================================

-- Create household_tasks table
CREATE TABLE IF NOT EXISTS household_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    hours DECIMAL(4,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_name (name),
    INDEX idx_hours (hours)
);

-- Insert sample tasks only if table is empty
INSERT IGNORE INTO household_tasks (name, hours, is_active) VALUES
('Kitchen cleanup', 0.5, TRUE),
('Vacuum entire apartment', 1.0, TRUE),
('Clean bathroom', 0.75, TRUE),
('Wash and hang laundry', 0.5, TRUE),
('Empty dishwasher', 0.25, TRUE),
('Take out trash', 0.25, TRUE),
('Mop floors', 1.0, TRUE),
('Clean windows', 1.5, TRUE),
('Change bed sheets', 0.5, TRUE),
('Fold laundry', 0.5, TRUE),
('Clean refrigerator', 1.0, TRUE),
('Garden work (1 hour)', 1.0, TRUE),
('Wash car', 1.5, TRUE),
('Organize basement', 2.0, TRUE),
('Grocery shopping', 1.0, TRUE);

-- ==============================================
-- MIGRATION 005: Link time entries to household tasks
-- ==============================================

-- Add task_id column if it doesn't exist
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'time_entries' 
  AND COLUMN_NAME = 'task_id';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE time_entries ADD COLUMN task_id INT NULL AFTER user_id',
    'SELECT "Column task_id already exists" AS Info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint for task_id (only if it doesn't exist)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'time_entries' 
  AND CONSTRAINT_NAME = 'fk_time_entries_task_id';

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE time_entries ADD CONSTRAINT fk_time_entries_task_id FOREIGN KEY (task_id) REFERENCES household_tasks(id) ON DELETE SET NULL',
    'SELECT "Foreign key fk_time_entries_task_id already exists" AS Info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for task_id if it doesn't exist
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'time_entries' 
  AND INDEX_NAME = 'idx_time_entries_task_id';

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_time_entries_task_id ON time_entries(task_id)',
    'SELECT "Index idx_time_entries_task_id already exists" AS Info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==============================================
-- TRIGGERS (Safe creation)
-- ==============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_balance_after_insert;
DROP TRIGGER IF EXISTS update_balance_after_delete;
DROP TRIGGER IF EXISTS update_balance_after_update;

DELIMITER $$

CREATE TRIGGER update_balance_after_insert
AFTER INSERT ON time_entries
FOR EACH ROW
BEGIN
    INSERT INTO user_time_balance (user_id, current_balance)
    VALUES (NEW.user_id, NEW.hours)
    ON DUPLICATE KEY UPDATE
        current_balance = current_balance + NEW.hours,
        last_updated = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_balance_after_delete
AFTER DELETE ON time_entries
FOR EACH ROW
BEGIN
    UPDATE user_time_balance
    SET current_balance = current_balance - OLD.hours,
        last_updated = CURRENT_TIMESTAMP
    WHERE user_id = OLD.user_id;
END$$

CREATE TRIGGER update_balance_after_update
AFTER UPDATE ON time_entries
FOR EACH ROW
BEGIN
    UPDATE user_time_balance
    SET current_balance = current_balance - OLD.hours + NEW.hours,
        last_updated = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
END$$

DELIMITER ;

-- Initialize balance for users who don't have one yet
INSERT IGNORE INTO user_time_balance (user_id, current_balance)
SELECT id, 0.00 FROM users;

-- ==============================================
-- VERIFICATION
-- ==============================================

SELECT 'Incremental migration completed successfully!' AS Status;
SHOW TABLES;