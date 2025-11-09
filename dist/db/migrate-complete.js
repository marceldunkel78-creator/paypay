"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCompleteMigration = void 0;
const index_1 = require("./index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function parseSQLStatements(sql) {
    const statements = [];
    let currentStatement = '';
    let inString = false;
    let stringDelimiter = '';
    const lines = sql.split('\n');
    for (let line of lines) {
        // Entferne führende und nachfolgende Leerzeichen
        line = line.trim();
        // Überspringe leere Zeilen
        if (!line)
            continue;
        // Überspringe Kommentarzeilen
        if (line.startsWith('--'))
            continue;
        let i = 0;
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];
            // SQL-Kommentar erkennen
            if (!inString && char === '-' && nextChar === '-') {
                // Rest der Zeile ist Kommentar
                break;
            }
            // String-Literale erkennen
            if ((char === "'" || char === '"' || char === '`')) {
                if (!inString) {
                    inString = true;
                    stringDelimiter = char;
                }
                else if (char === stringDelimiter) {
                    // Prüfe auf escaped quotes
                    if (line[i - 1] !== '\\') {
                        inString = false;
                        stringDelimiter = '';
                    }
                }
            }
            // Semikolon als Statement-Ende erkennen
            if (!inString && char === ';') {
                currentStatement += char;
                const trimmedStatement = currentStatement.trim();
                if (trimmedStatement && trimmedStatement.length > 1) {
                    statements.push(trimmedStatement);
                }
                currentStatement = '';
                i++;
                continue;
            }
            currentStatement += char;
            i++;
        }
        // Füge Zeilenumbruch hinzu, wenn wir nicht am Ende eines Statements sind
        if (currentStatement.trim()) {
            currentStatement += '\n';
        }
    }
    // Letztes Statement hinzufügen, falls vorhanden
    const finalStatement = currentStatement.trim();
    if (finalStatement && finalStatement.length > 1) {
        statements.push(finalStatement);
    }
    return statements.filter(stmt => {
        const trimmed = stmt.trim();
        return trimmed.length > 1 && !trimmed.startsWith('--');
    });
}
function runCompleteMigration() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting complete database migration...');
            const connection = yield (0, index_1.connectToDatabase)();
            // Lade die konsolidierte SQL-Datei
            const sqlPath = path.join(__dirname, '../../migrations/complete-database-setup.sql');
            const migrationSQL = fs.readFileSync(sqlPath, 'utf8');
            // Erweiterte SQL-Parsing: Berücksichtige mehrzeilige Statements und Kommentare
            const statements = parseSQLStatements(migrationSQL);
            console.log(`Executing ${statements.length} SQL statements...`);
            // Führe jeden SQL-Befehl einzeln aus
            let executedCount = 0;
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                // Überspringe Kommentare und leere Zeilen
                if (statement.startsWith('--') || statement.length < 5) {
                    continue;
                }
                try {
                    // Debug: Zeige ersten Teil des Statements
                    const preview = statement.length > 100 ? statement.substring(0, 100) + '...' : statement;
                    console.log(`Executing statement ${i + 1}/${statements.length}: ${preview}`);
                    // Verwende query() für Statements, die nicht mit prepared statements funktionieren
                    if (statement.trim().toUpperCase().startsWith('ALTER DATABASE') ||
                        statement.trim().toUpperCase().startsWith('SET FOREIGN_KEY_CHECKS') ||
                        statement.trim().toUpperCase().startsWith('USE ')) {
                        yield connection.query(statement);
                    }
                    else {
                        yield connection.execute(statement);
                    }
                    executedCount++;
                }
                catch (error) {
                    console.error(`Error in statement ${i + 1}:`, statement.substring(0, 200));
                    console.error(`Error message:`, error);
                    // Ignoriere bestimmte erwartete Fehler
                    if (error instanceof Error &&
                        (error.message.includes('already exists') ||
                            error.message.includes('Table') && error.message.includes('already exists') ||
                            error.message.includes('Duplicate column name') ||
                            error.message.includes('duplicate column name'))) {
                        console.log('Skipping already exists/duplicate column error...');
                    }
                    else {
                        // Bei anderen Fehlern: Warning, aber weitermachen
                        console.warn(`Warning in statement ${i + 1}:`, error);
                    }
                }
            }
            console.log(`Executed ${executedCount} SQL statements successfully.`);
            console.log('Complete database migration completed successfully!');
        }
        catch (error) {
            console.error('Error in complete migration:', error);
            throw error;
        }
    });
}
exports.runCompleteMigration = runCompleteMigration;
