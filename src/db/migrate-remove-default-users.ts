import { connectToDatabase } from './index';

export async function removeDefaultUsers(): Promise<void> {
    try {
        console.log('Starting default users cleanup...');
        const db = await connectToDatabase();

        // Check if default users exist
        const [userRows] = await db.execute(`
            SELECT id, username FROM users WHERE username IN ('admin1', 'admin2', 'user1')
        `);

        const defaultUsers = userRows as any[];
        if (defaultUsers.length === 0) {
            console.log('No default test users found to remove');
            return;
        }

        // Start transaction for safe deletion
        await db.query('START TRANSACTION');

        try {
            // First, delete all related data for these users
            for (const user of defaultUsers) {
                console.log(`Removing data for user: ${user.username}`);
                
                // Delete time_accounts entries
                await db.execute('DELETE FROM time_accounts WHERE user_id = ?', [user.id]);
                
                // Delete time_entries entries
                await db.execute('DELETE FROM time_entries WHERE user_id = ?', [user.id]);
                
                // Delete user_time_balance entries
                await db.execute('DELETE FROM user_time_balance WHERE user_id = ?', [user.id]);
            }

            // Now delete the users themselves
            const [result] = await db.execute(`
                DELETE FROM users WHERE username IN ('admin1', 'admin2', 'user1')
            `);

            // Commit transaction
            await db.query('COMMIT');

            const deleteResult = result as any;
            console.log(`Removed ${deleteResult.affectedRows} default test user(s) and all related data`);
        } catch (error) {
            // Rollback on error
            await db.query('ROLLBACK');
            throw error;
        }

        console.log('Default users cleanup completed successfully!');
        console.log('To create a proper admin user, run: node scripts/create-admin.js');
    } catch (error) {
        // Only log as warning, don't fail the migration
        console.warn('Default users cleanup skipped:', (error as Error).message);
    }
}