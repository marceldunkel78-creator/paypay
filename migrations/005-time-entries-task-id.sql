-- Time Entries Update Migration
-- Fügt task_id Spalte hinzu für Verknüpfung mit Hausarbeiten

-- Füge task_id Spalte zur time_entries Tabelle hinzu
ALTER TABLE time_entries 
ADD COLUMN task_id INT NULL AFTER user_id,
ADD CONSTRAINT fk_time_entries_task_id 
    FOREIGN KEY (task_id) REFERENCES household_tasks(id) 
    ON DELETE SET NULL;

-- Index für bessere Performance
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);