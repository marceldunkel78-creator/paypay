-- ==============================================
-- PayPay Database Setup - Complete Migration
-- Description: Complete database schema for fresh installations
-- Version: 1.0
-- Created: November 2025
-- ==============================================

-- Drop existing tables if they exist (for clean reinstalls)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS time_entries;
DROP TABLE IF EXISTS user_time_balance;
DROP TABLE IF EXISTS time_accounts;
DROP TABLE IF EXISTS household_tasks;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================
-- CORE TABLES
-- ==============================================

-- Users table for authentication and role management
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_email (email),
    INDEX idx_approved (is_approved)
);

-- Time accounts table for tracking time requests and approvals
CREATE TABLE time_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    request_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, request_status),
    INDEX idx_created (created_at)
);

-- Household tasks table for predefined tasks with fixed time rewards
CREATE TABLE household_tasks (
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

-- Time entries table for individual time tracking with approval workflow
CREATE TABLE time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NULL,
    hours DECIMAL(5,2) NOT NULL, -- Can be positive or negative
    entry_type ENUM('productive', 'screen_time') NOT NULL,
    description VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_at TIMESTAMP NULL,
    approved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES household_tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_entry_type (entry_type),
    INDEX idx_created (created_at),
    INDEX idx_task_id (task_id),
    INDEX idx_status (status),
    INDEX idx_user_status (user_id, status),
    INDEX idx_approved_by (approved_by)
);

-- User time balance table for current balance per user
CREATE TABLE user_time_balance (
    user_id INT PRIMARY KEY,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- TRIGGERS FOR AUTOMATIC BALANCE CALCULATION
-- ==============================================

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

-- ==============================================
-- INITIAL DATA
-- ==============================================

-- Default admin users (passwords should be properly hashed in production)
INSERT INTO users (username, password, email, role, is_approved) VALUES 
('admin1', '$2b$10$example.hash1', 'admin1@paypay.local', 'admin', TRUE),
('admin2', '$2b$10$example.hash2', 'admin2@paypay.local', 'admin', TRUE),
('user1', '$2b$10$example.hash3', 'user1@paypay.local', 'user', TRUE);

-- Sample household tasks with their time values
INSERT INTO household_tasks (name, hours, is_active) VALUES
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

-- Initialize balance for existing users
INSERT INTO user_time_balance (user_id, current_balance)
SELECT id, 0.00 FROM users;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify table creation
SELECT 'Database setup completed successfully!' AS Status;
SELECT COUNT(*) AS 'Users created' FROM users;
SELECT COUNT(*) AS 'Household tasks created' FROM household_tasks;
SELECT COUNT(*) AS 'User balances initialized' FROM user_time_balance;

-- Display table structure
SHOW TABLES;