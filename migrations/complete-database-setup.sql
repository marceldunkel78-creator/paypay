-- PayPay Complete Database Schema
-- Konsolidierte Migration für frische Datenbank-Installation
-- Version: 2024-11-09

-- ====================================
-- 1. Benutzer-System
-- ====================================

-- Hauptbenutzer-Tabelle
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
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
CREATE TABLE IF NOT EXISTS household_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    hours DECIMAL(4, 2) DEFAULT 1.00,
    weight_factor DECIMAL(3, 2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (is_active),
    INDEX idx_weight (weight_factor),
    INDEX idx_hours (hours)
);

-- Zuerst vorhandene Duplikate bereinigen
DELETE t1 FROM household_tasks t1 
INNER JOIN household_tasks t2 
WHERE t1.id > t2.id AND t1.name = t2.name;

-- Hours-Spalte ist bereits in CREATE TABLE definiert, daher nicht nochmal hinzufügen

-- Hours-Werte für bestehende Aufgaben setzen
UPDATE household_tasks SET hours = 0.50 WHERE name = 'Küche aufräumen';
UPDATE household_tasks SET hours = 0.75 WHERE name = 'Staubsaugen';
UPDATE household_tasks SET hours = 1.00 WHERE name = 'Badezimmer putzen';
UPDATE household_tasks SET hours = 0.40 WHERE name = 'Wäsche waschen';
UPDATE household_tasks SET hours = 0.15 WHERE name = 'Müll rausbringen';
UPDATE household_tasks SET hours = 0.25 WHERE name = 'Betten machen';
UPDATE household_tasks SET hours = 0.60 WHERE name = 'Einkaufen';

-- Standard-Hausarbeiten einfügen (nur wenn noch nicht vorhanden)
INSERT IGNORE INTO household_tasks (name, description, weight_factor) VALUES
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
CREATE TABLE IF NOT EXISTS time_entries (
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

-- Legacy Time Accounts (für Genehmigungssystem)
CREATE TABLE IF NOT EXISTS time_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    hours DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Benutzer-Zeitkonto-Balance (persistent, unabhängig von time_entries)
CREATE TABLE IF NOT EXISTS user_time_balance (
    user_id INT PRIMARY KEY,
    current_balance DECIMAL(10, 2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_balance (current_balance),
    INDEX idx_updated (last_updated)
);

-- ====================================
-- 5. Zeit-Transfer-System
-- ====================================

-- Zeit-Transfers zwischen Benutzern
CREATE TABLE IF NOT EXISTS time_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    hours DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id),
    INDEX idx_created_at (created_at)
);

-- ====================================
-- 6. Standarddaten und Initialisierung
-- ====================================

-- Standard Admin-Benutzer erstellen (falls nicht vorhanden)
-- Passwort: admin123 (gehashed mit bcrypt)
INSERT IGNORE INTO users (username, email, password, role, status) VALUES 
('admin', 'admin@paypay.local', '$2b$10$ahAGd1wNeKaSZ4miEhxnj.YvKIfnu3f3eoQT8JJqVx3DRkVymQ9yK', 'admin', 'active');

-- Standard-Gewichtungsfaktoren für bestehende Hausarbeiten aktualisieren
UPDATE household_tasks SET weight_factor = 1.00 WHERE name = 'Küche aufräumen';
UPDATE household_tasks SET weight_factor = 1.50 WHERE name = 'Staubsaugen';
UPDATE household_tasks SET weight_factor = 2.00 WHERE name = 'Badezimmer putzen';
UPDATE household_tasks SET weight_factor = 0.75 WHERE name = 'Wäsche waschen';
UPDATE household_tasks SET weight_factor = 0.25 WHERE name = 'Müll rausbringen';
UPDATE household_tasks SET weight_factor = 0.50 WHERE name = 'Betten machen';
UPDATE household_tasks SET weight_factor = 1.25 WHERE name = 'Einkaufen';

-- ====================================
-- 7. Datenbank-Optimierungen
-- ====================================

-- Charset und Collation für konsistente UTF-8 Unterstützung
-- ALTER DATABASE time_account_db CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ====================================
-- Migration erfolgreich abgeschlossen
-- ====================================

-- Prüfung der erstellten Tabellen
SELECT 'Migration completed successfully!' as status;
SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'time_account_db' 
ORDER BY TABLE_NAME;