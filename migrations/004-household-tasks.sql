-- ==============================================
-- Migration 004: Household Tasks
-- Description: Creates predefined household tasks with fixed time values
-- ==============================================

-- Create household tasks table for predefined tasks with fixed time rewards
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

-- Insert sample household tasks with their time values
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