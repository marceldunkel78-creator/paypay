-- ==============================================
-- Migration 001: Initial Database Setup
-- Description: Creates core user management and time account tables
-- ==============================================

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
);

-- Time accounts table for tracking time requests and approvals
CREATE TABLE IF NOT EXISTS time_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    request_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, request_status),
    INDEX idx_created (created_at)
);

-- Default users (passwords should be properly hashed in production)
INSERT IGNORE INTO users (username, password, role) VALUES 
('admin1', 'hashed_password1', 'admin'),
('admin2', 'hashed_password2', 'admin'),
('user1', 'hashed_password3', 'user');