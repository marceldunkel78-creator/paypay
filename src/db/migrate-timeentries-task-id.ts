import { connectToDatabase } from './index';
import * as fs from 'fs';
import * as path from 'path';

export async function migrateTimeEntriesTaskId(): Promise<void> {
    try {
        console.log('Starting time entries task_id migration...');
        const db = await connectToDatabase();
        
        // Check if task_id column already exists
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'time_entries' 
            AND COLUMN_NAME = 'task_id'
        `);
        
        if ((columns as any[]).length > 0) {
            console.log('Time entries task_id column already exists, skipping migration.');
            return;
        }
        
        // Read and execute migration SQL
        const migrationPath = path.join(__dirname, '../../migrations/005-time-entries-task-id.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        // Split SQL statements and execute them
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            await db.execute(statement);
        }
        
        console.log('Time entries task_id migration completed successfully!');
    } catch (error) {
        console.error('Error during time entries task_id migration:', error);
        throw new Error('Time entries task_id migration failed');
    }
}