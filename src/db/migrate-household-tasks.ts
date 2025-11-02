import { connectToDatabase } from './index';
import * as fs from 'fs';
import * as path from 'path';

export async function migrateHouseholdTasks(): Promise<void> {
    try {
        console.log('Starting household tasks migration...');
        const db = await connectToDatabase();
        
        // Check if household_tasks table exists
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'household_tasks'
        `);
        
        if ((tables as any[]).length > 0) {
            console.log('Household tasks table already exists, skipping migration.');
            return;
        }
        
        // Read and execute migration SQL
        const migrationPath = path.join(__dirname, '../../migrations/004-household-tasks.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        // Execute migration step by step
        
        // 1. Create table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS household_tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                hours DECIMAL(4,2) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // 2. Insert example data
        await db.execute(`
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
            ('Einkaufen erledigen', 1.0, TRUE)
        `);
        
        // 3. Create indexes (if they don't exist)
        try {
            await db.execute(`CREATE INDEX idx_household_tasks_active ON household_tasks(is_active)`);
        } catch (error: any) {
            if (error.code !== 'ER_DUP_KEYNAME') {
                throw error;
            }
        }
        
        try {
            await db.execute(`CREATE INDEX idx_household_tasks_name ON household_tasks(name)`);
        } catch (error: any) {
            if (error.code !== 'ER_DUP_KEYNAME') {
                throw error;
            }
        }
        
        console.log('Household tasks migration completed successfully!');
    } catch (error) {
        console.error('Error during household tasks migration:', error);
        throw new Error('Household tasks migration failed');
    }
}