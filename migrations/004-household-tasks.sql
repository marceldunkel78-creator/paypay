-- Household Tasks Migration
-- Erstellt Tabelle für vordefinierte Hausarbeiten mit festen Zeitwerten

CREATE TABLE IF NOT EXISTS household_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    hours DECIMAL(4,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Beispiel-Hausarbeiten einfügen
INSERT IGNORE INTO household_tasks (name, hours, is_active) VALUES
('Küche aufräumen', 0.5, TRUE),
('Staubsaugen (ganze Wohnung)', 1.0, TRUE),
('Badezimmer putzen', 0.75, TRUE),
('Wäsche waschen und aufhängen', 0.5, TRUE),
('Geschirrspüler ausräumen', 0.25, TRUE),
('Müll rausbringen', 0.25, TRUE),
('Boden wischen', 1.0, TRUE),
('Fenster putzen', 1.5, TRUE),
('Betten beziehen', 0.5, TRUE),
('Wäsche zusammenlegen', 0.5, TRUE),
('Kühlschrank reinigen', 1.0, TRUE),
('Gartenarbeit (1 Stunde)', 1.0, TRUE),
('Auto waschen', 1.5, TRUE),
('Keller aufräumen', 2.0, TRUE),
('Einkaufen erledigen', 1.0, TRUE);

-- Index für bessere Performance bei Abfragen
CREATE INDEX idx_household_tasks_active ON household_tasks(is_active);
CREATE INDEX idx_household_tasks_name ON household_tasks(name);