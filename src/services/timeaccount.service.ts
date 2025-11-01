import { TimeAccount } from '../models/timeaccount.model';
import { connectToDatabase } from '../db/index';

export class TimeAccountService {
    public async createTimeAccount(userId: number, hours: number): Promise<TimeAccount> {
        const connection = await connectToDatabase();
        const [result] = await connection.execute(
            'INSERT INTO time_accounts (user_id, hours) VALUES (?, ?)',
            [userId, hours]
        );
        
        const insertResult = result as any;
        return {
            id: insertResult.insertId,
            user_id: userId,
            hours: hours,
            status: 'pending'
        };
    }

    public async getTimeAccountsByUser(userId: number): Promise<TimeAccount[]> {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute(
            'SELECT * FROM time_accounts WHERE user_id = ?',
            [userId]
        );
        return rows as TimeAccount[];
    }

    public async getTimeAccounts(): Promise<TimeAccount[]> {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute('SELECT * FROM time_accounts');
        return rows as TimeAccount[];
    }

    public async getTimeAccountById(id: number): Promise<TimeAccount | null> {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute(
            'SELECT * FROM time_accounts WHERE id = ?',
            [id]
        );
        const accounts = rows as TimeAccount[];
        return accounts[0] || null;
    }

    public async getRequestById(id: number): Promise<any> {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute(
            'SELECT ta.*, u.username as userEmail FROM time_accounts ta JOIN users u ON ta.user_id = u.id WHERE ta.id = ?',
            [id]
        );
        const results = rows as any[];
        return results[0] || null;
    }

    public async updateTimeAccountStatus(id: number, status: 'approved' | 'rejected'): Promise<void> {
        const connection = await connectToDatabase();
        await connection.execute(
            'UPDATE time_accounts SET status = ? WHERE id = ?',
            [status, id]
        );
    }

    public async deleteTimeAccount(id: number): Promise<boolean> {
        const connection = await connectToDatabase();
        const [result] = await connection.execute(
            'DELETE FROM time_accounts WHERE id = ?',
            [id]
        );
        const deleteResult = result as any;
        return deleteResult.affectedRows > 0;
    }

    public async approveRequest(accountId: number): Promise<boolean> {
        await this.updateTimeAccountStatus(accountId, 'approved');
        return true;
    }

    public async rejectRequest(accountId: number): Promise<boolean> {
        await this.updateTimeAccountStatus(accountId, 'rejected');
        return true;
    }
}