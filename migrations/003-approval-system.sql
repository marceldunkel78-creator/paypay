-- Migration für Admin-Genehmigungssystem

-- Erweitere time_entries Tabelle um Genehmigungsfelder
ALTER TABLE time_entries 
ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
ADD COLUMN approved_at TIMESTAMP NULL,
ADD COLUMN approved_by INT NULL,
ADD FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Index für bessere Performance bei Status-Abfragen
ALTER TABLE time_entries 
ADD INDEX idx_status (status),
ADD INDEX idx_user_status (user_id, status);