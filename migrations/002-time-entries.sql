-- Migration für benutzerspezifische Zeiteinträge mit positivem/negativem Tracking

-- Neue Tabelle für individuelle Zeiteinträge
CREATE TABLE time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hours DECIMAL(5,2) NOT NULL, -- Kann positiv oder negativ sein
    entry_type ENUM('productive', 'screen_time') NOT NULL, -- produktive Zeit oder Bildschirmzeit
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at)
);

-- Tabelle für den aktuellen Zeitkontostand pro User
CREATE TABLE user_time_balance (
    user_id INT PRIMARY KEY,
    current_balance DECIMAL(10,2) DEFAULT 0.00, -- Aktueller Saldo
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trigger für automatische Balance-Aktualisierung bei neuen Einträgen
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

DELIMITER ;

-- Event für automatische Löschung alter Einträge (älter als 1 Woche)
SET GLOBAL event_scheduler = ON;

DELIMITER $$

CREATE EVENT IF NOT EXISTS cleanup_old_entries
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM time_entries 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK);
END$$

DELIMITER ;

-- Initialisiere Balance für existierende User
INSERT INTO user_time_balance (user_id, current_balance)
SELECT id, 0.00 FROM users
ON DUPLICATE KEY UPDATE current_balance = current_balance;