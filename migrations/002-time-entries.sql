-- ==============================================
-- Migration 002: Time Entries System
-- Description: Individual time tracking with positive/negative entries and automatic balance calculation
-- ==============================================

-- Individual time entries table for tracking productive and screen time
-- Note: task_id will be added in migration 005 after household_tasks table is created
CREATE TABLE IF NOT EXISTS time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hours DECIMAL(5,2) NOT NULL, -- Can be positive or negative
    entry_type ENUM('productive', 'screen_time') NOT NULL, -- Productive time or screen time
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_entry_type (entry_type),
    INDEX idx_created (created_at)
);

-- User time balance table for current balance per user
CREATE TABLE IF NOT EXISTS user_time_balance (
    user_id INT PRIMARY KEY,
    current_balance DECIMAL(10,2) DEFAULT 0.00, -- Current balance
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Triggers for automatic balance updates when entries are added/removed
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS update_balance_after_insert
AFTER INSERT ON time_entries
FOR EACH ROW
BEGIN
    INSERT INTO user_time_balance (user_id, current_balance)
    VALUES (NEW.user_id, NEW.hours)
    ON DUPLICATE KEY UPDATE
        current_balance = current_balance + NEW.hours,
        last_updated = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER IF NOT EXISTS update_balance_after_delete
AFTER DELETE ON time_entries
FOR EACH ROW
BEGIN
    UPDATE user_time_balance
    SET current_balance = current_balance - OLD.hours,
        last_updated = CURRENT_TIMESTAMP
    WHERE user_id = OLD.user_id;
END$$

DELIMITER ;

-- Optional: Event for automatic cleanup of old entries (older than 1 week)
-- Uncomment if you want automatic cleanup
-- SET GLOBAL event_scheduler = ON;
-- 
-- DELIMITER $$
-- 
-- CREATE EVENT IF NOT EXISTS cleanup_old_entries
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO
-- BEGIN
--     DELETE FROM time_entries 
--     WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK);
-- END$$
-- 
-- DELIMITER ;

-- Initialize balance for existing users
INSERT IGNORE INTO user_time_balance (user_id, current_balance)
SELECT id, 0.00 FROM users;