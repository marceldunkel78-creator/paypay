-- Datenbank komplett neu anlegen
DROP DATABASE IF EXISTS time_account_db;
CREATE DATABASE time_account_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE time_account_db;

-- ====================================
-- 1. Benutzer-System
-- ====================================

-- Benutzer mit Rollen und Status
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('pending', 'approved', 'suspended') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- ====================================
-- 2. Hausarbeiten-System
-- ====================================

-- Hausarbeiten mit Gewichtungsfaktoren
CREATE TABLE household_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight_factor DECIMAL(3, 2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (is_active),
    INDEX idx_weight (weight_factor)
);

-- Standard-Hausarbeiten einfügen
INSERT INTO household_tasks (name, description, weight_factor) VALUES
('Küche aufräumen', 'Abwaschen, Arbeitsflächen reinigen, aufräumen', 1.00),
('Staubsaugen', 'Alle Böden staubsaugen', 1.50),
('Badezimmer putzen', 'Komplette Badezimmerreinigung', 2.00),
('Wäsche waschen', 'Wäsche sortieren, waschen, aufhängen', 0.75),
('Müll rausbringen', 'Alle Mülleimer leeren und Müll entsorgen', 0.25),
('Betten machen', 'Alle Betten in der Wohnung machen', 0.50),
('Einkaufen', 'Lebensmitteleinkauf erledigen', 1.25);

-- ====================================
-- 3. Zeiterfassungs-System
-- ====================================

-- Zeiteinträge (sowohl produktive Zeit als auch Bildschirmzeit)
CREATE TABLE time_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entry_type ENUM('productive', 'screen_time') NOT NULL,
    hours DECIMAL(10, 2) NOT NULL,
    description TEXT,
    task_id INT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    input_minutes INT NULL,
    calculated_hours DECIMAL(10, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES household_tasks(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_entry_type (entry_type),
    INDEX idx_status (status),
    INDEX idx_task_id (task_id),
    INDEX idx_created_at (created_at)
);

-- ====================================
-- 4. Zeitkonto-System
-- ====================================

-- Zeitkonten für User
CREATE TABLE time_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- ====================================
-- 5. Benutzer-Zeitkonto-Saldo
-- ====================================

-- Aktuelle Salden der Benutzer
CREATE TABLE user_time_balance (
    user_id INT PRIMARY KEY,
    current_balance DECIMAL(10, 2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ====================================
-- 6. Zeit-Transfer-System
-- ====================================

-- Zeit-Transfers zwischen Benutzern
CREATE TABLE time_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    hours DECIMAL(10, 2) NOT NULL,
    message TEXT,
    status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- ====================================
-- 7. Standard-Admin-Benutzer
-- ====================================

-- Admin-Benutzer erstellen
INSERT INTO users (username, email, password, role, status) VALUES
('admin', 'admin@paypay.local', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'approved');

-- ====================================
-- Fertig!
-- ====================================

SELECT 'Datenbank erfolgreich neu erstellt!' as status;
SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'time_account_db'
ORDER BY TABLE_NAME;