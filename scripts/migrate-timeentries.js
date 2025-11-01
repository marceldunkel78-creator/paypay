// Migration script für Zeiteinträge - direkt über Node.js ausführen
import { connectToDatabase } from '../src/db/index.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    try {
        console.log('Verbinde zur Datenbank...');
        const db = await connectToDatabase();
        
        console.log('Lese Migrationsdatei...');
        const migrationPath = path.join(process.cwd(), 'migrations', '002-time-entries-simple.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split SQL by semicolons and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        console.log(`Führe ${statements.length} SQL-Statements aus...`);
        
        for (const statement of statements) {
            console.log('Führe aus:', statement.substring(0, 50) + '...');
            await db.execute(statement);
        }
        
        console.log('Migration erfolgreich abgeschlossen!');
        process.exit(0);
    } catch (error) {
        console.error('Migration fehlgeschlagen:', error);
        process.exit(1);
    }
}

runMigration();