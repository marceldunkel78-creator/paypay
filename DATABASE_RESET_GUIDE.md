# PayPay Datenbank Reset und Migration

## Schritt 1: Datenbank zurücksetzen (MySQL Workbench)

### Option A: Komplette Datenbank löschen und neu erstellen
```sql
-- 1. Datenbank löschen (ACHTUNG: Alle Daten gehen verloren!)
DROP DATABASE IF EXISTS paypay;

-- 2. Neue Datenbank erstellen
CREATE DATABASE paypay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Datenbank auswählen
USE paypay;
```

### Option B: Nur Tabellen löschen (falls Datenbank behalten werden soll)
```sql
-- Datenbank auswählen
USE paypay;

-- Foreign Key Constraints temporär deaktivieren
SET FOREIGN_KEY_CHECKS = 0;

-- Alle Tabellen löschen
DROP TABLE IF EXISTS time_transfers;
DROP TABLE IF EXISTS user_time_balance;
DROP TABLE IF EXISTS time_accounts;
DROP TABLE IF EXISTS time_entries;
DROP TABLE IF EXISTS household_tasks;
DROP TABLE IF EXISTS users;

-- Foreign Key Constraints wieder aktivieren
SET FOREIGN_KEY_CHECKS = 1;
```

## Schritt 2: Migration mit der neuen konsolidierten Datei

### Option A: Direkt in MySQL Workbench
1. Öffnen Sie MySQL Workbench
2. Verbinden Sie sich mit Ihrem MySQL Server
3. Öffnen Sie die Datei `migrations/complete-database-setup.sql`
4. Führen Sie das gesamte Script aus (Ctrl+Shift+Enter)

### Option B: Über die Node.js Anwendung
1. Ersetzen Sie `src/app.ts` durch `src/app-simple-migration.ts`:
   ```bash
   mv src/app.ts src/app-backup.ts
   mv src/app-simple-migration.ts src/app.ts
   ```

2. Bauen und starten Sie die Anwendung:
   ```bash
   npm run build
   npm start
   ```

## Schritt 3: Verifikation

Nach der Migration sollten folgende Tabellen existieren:
- `users` - Benutzer mit Rollen und Status
- `household_tasks` - Hausarbeiten mit Gewichtungsfaktoren
- `time_entries` - Zeiteinträge (produktiv/Bildschirmzeit)
- `time_accounts` - Legacy Genehmigungssystem
- `user_time_balance` - Persistente Benutzer-Balances
- `time_transfers` - Zeit-Transfers zwischen Benutzern

### Verifikations-SQL:
```sql
-- Tabellen prüfen
SHOW TABLES;

-- Datenbestand prüfen
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'household_tasks', COUNT(*) FROM household_tasks
UNION ALL
SELECT 'time_entries', COUNT(*) FROM time_entries
UNION ALL
SELECT 'time_accounts', COUNT(*) FROM time_accounts
UNION ALL
SELECT 'user_time_balance', COUNT(*) FROM user_time_balance
UNION ALL
SELECT 'time_transfers', COUNT(*) FROM time_transfers;

-- Standard-Daten prüfen
SELECT * FROM household_tasks;
SELECT username, role, status FROM users;
```

## Vorteile der neuen Migration:
1. ✅ **Eine einzige Datei** statt 10+ verschiedene Migrationen
2. ✅ **Vollständige Schema-Definition** in korrekter Reihenfolge
3. ✅ **Foreign Key Constraints** korrekt definiert
4. ✅ **Standard-Daten** werden automatisch eingefügt
5. ✅ **Einfacher zu warten** und zu verstehen
6. ✅ **Konsistente Datenbank-State** garantiert

## Alte Migrations-Dateien
Die alten Migrations-Dateien können nach erfolgreichem Test gelöscht werden:
- `src/db/migrate-*.ts` (außer `migrate-complete.ts`)
- Einzelne SQL-Dateien in `migrations/` (außer `complete-database-setup.sql`)

## Notfall-Rollback
Falls etwas schief geht, können Sie jederzeit zur alten app.ts zurückkehren:
```bash
mv src/app.ts src/app-new.ts
mv src/app-backup.ts src/app.ts
npm run build
npm start
```