-- Einfache Migration für Zeiteinträge (ohne Trigger für bessere Kompatibilität)

-- Neue Tabelle für individuelle Zeiteinträge
CREATE TABLE IF NOT EXISTS time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    entry_type ENUM('productive', 'screen_time') NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at)
);

-- Tabelle für den aktuellen Zeitkontostand pro User
CREATE TABLE IF NOT EXISTS user_time_balance (
    user_id INT PRIMARY KEY,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Initialisiere Balance für existierende User
INSERT IGNORE INTO user_time_balance (user_id, current_balance)
SELECT id, 0.00 FROM users;