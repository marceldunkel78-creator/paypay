-- PayPay Database Reset Script
-- Für MySQL Workbench: Kompletter Reset der Datenbank

-- ====================================
-- ACHTUNG: Alle Daten gehen verloren!
-- ====================================

-- Datenbank löschen und neu erstellen
DROP DATABASE IF EXISTS paypay;
CREATE DATABASE paypay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE paypay;

-- Erfolgsmeldung
SELECT 'Database paypay reset successfully. Ready for migration.' as status;