import { connectToDatabase } from './index';

export async function migrateUserStatus(): Promise<void> {
    try {
        console.log('Starting user status migration...');
        const db = await connectToDatabase();

        // Check if status column already exists
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'status'
        `);

        if ((columns as any[]).length > 0) {
            console.log('User status column already exists, skipping migration.');
            return;
        }

        // Add status column with enum values
        await db.execute(`
            ALTER TABLE users 
            ADD COLUMN status ENUM('active', 'pending', 'suspended') DEFAULT 'pending'
        `);

        // Update existing users to 'active' status (they were already approved)
        await db.execute(`
            UPDATE users SET status = 'active' WHERE status = 'pending'
        `);

        // Create index for better performance on status queries
        await db.execute(`
            CREATE INDEX idx_users_status ON users(status)
        `);

        console.log('User status migration completed successfully!');
    } catch (error) {
        console.error('Error during user status migration:', error);
        throw error;
    }
}