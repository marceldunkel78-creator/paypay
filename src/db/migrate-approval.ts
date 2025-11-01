import { connectToDatabase } from './index';

export async function migrateApprovalSystem(): Promise<void> {
    try {
        console.log('Starting approval system migration...');
        const db = await connectToDatabase();
        
        // Check if columns already exist
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'time_account_db' 
            AND TABLE_NAME = 'time_entries' 
            AND COLUMN_NAME IN ('status', 'approved_at', 'approved_by')
        `);
        
        if ((columns as any[]).length === 0) {
            // Add approval system columns
            await db.execute(`
                ALTER TABLE time_entries 
                ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                ADD COLUMN approved_at TIMESTAMP NULL,
                ADD COLUMN approved_by INT NULL
            `);
            
            // Add foreign key constraint
            await db.execute(`
                ALTER TABLE time_entries 
                ADD FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
            `);
            
            // Add indexes for better performance
            await db.execute(`
                ALTER TABLE time_entries 
                ADD INDEX idx_status (status),
                ADD INDEX idx_user_status (user_id, status)
            `);
            
            console.log('Approval system migration completed successfully!');
        } else {
            console.log('Approval system already exists, skipping migration.');
        }
    } catch (error) {
        console.error('Approval system migration failed:', error);
        throw error;
    }
}