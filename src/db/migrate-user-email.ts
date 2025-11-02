import { connectToDatabase } from './index';
import * as fs from 'fs';
import * as path from 'path';

export async function migrateUserEmail(): Promise<void> {
    try {
        console.log('Starting user email migration...');
        
        const db = await connectToDatabase();
        
        // Check if email column already exists
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'email'
        `);
        
        if ((columns as any[]).length > 0) {
            console.log('Email column already exists, skipping migration.');
            return;
        }
        
        // Run migration
        const migrationPath = path.join(__dirname, '../../migrations/006-add-user-email.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        // Split and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 50) + '...');
                await db.execute(statement);
            }
        }
        
        console.log('User email migration completed successfully!');
        
    } catch (error) {
        console.error('Error during user email migration:', error);
        throw error;
    }
}