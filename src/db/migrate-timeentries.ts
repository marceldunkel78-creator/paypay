import { connectToDatabase } from './index';

export async function migrateTimeEntries(): Promise<void> {
    try {
        console.log('Starting time entries migration...');
        const db = await connectToDatabase();
        
        // Create time_entries table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS time_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                hours DECIMAL(5,2) NOT NULL,
                entry_type ENUM('productive', 'screen_time') NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_created (user_id, created_at)
            )
        `);
        
        // Create user_time_balance table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_time_balance (
                user_id INT PRIMARY KEY,
                current_balance DECIMAL(10,2) DEFAULT 0.00,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Initialize balance for existing users
        await db.execute(`
            INSERT IGNORE INTO user_time_balance (user_id, current_balance)
            SELECT id, 0.00 FROM users
        `);
        
        console.log('Time entries migration completed successfully!');
    } catch (error) {
        console.error('Time entries migration failed:', error);
        throw error;
    }
}