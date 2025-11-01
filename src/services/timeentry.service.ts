import { connectToDatabase } from '../db';
import { TimeEntry, UserTimeBalance } from '../models/timeentry.model';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class TimeEntryService {
    
    // Neue Zeiterfassung erstellen (positiv oder negativ) - Status: pending
    async createTimeEntry(timeEntry: Omit<TimeEntry, 'id' | 'created_at' | 'approved_at' | 'approved_by'>): Promise<TimeEntry> {
        try {
            const db = await connectToDatabase();
            const query = `
                INSERT INTO time_entries (user_id, hours, entry_type, description, status)
                VALUES (?, ?, ?, ?, 'pending')
            `;
            
            const [result] = await db.execute<ResultSetHeader>(
                query,
                [timeEntry.user_id, timeEntry.hours, timeEntry.entry_type, timeEntry.description || null]
            );

            console.log('Time entry created (pending approval):', result.insertId);

            // NICHT die Balance aktualisieren - erst bei Genehmigung!

            // Neu erstellten Eintrag zurückgeben
            return {
                id: result.insertId,
                ...timeEntry,
                status: 'pending',
                created_at: new Date()
            };
        } catch (error) {
            console.error('Error creating time entry:', error);
            throw new Error('Failed to create time entry');
        }
    }

    // Alle Zeiteinträge eines Users abrufen (optional nur bestimmte Status)
    async getUserTimeEntries(userId: number, limit: number = 50, status?: string): Promise<TimeEntry[]> {
        try {
            const db = await connectToDatabase();
            // Validate and sanitize limit parameter
            const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
            
            let query = `
                SELECT id, user_id, hours, entry_type, description, status, created_at, approved_at, approved_by
                FROM time_entries 
                WHERE user_id = ?
            `;
            
            const params: any[] = [userId];
            
            if (status) {
                query += ` AND status = ?`;
                params.push(status);
            }
            
            query += ` ORDER BY created_at DESC LIMIT ${safeLimit}`;
            
            const [rows] = await db.execute<RowDataPacket[]>(query, params);
            
            return rows.map((row: any) => ({
                id: row.id,
                user_id: row.user_id,
                hours: parseFloat(row.hours),
                entry_type: row.entry_type,
                description: row.description,
                status: row.status,
                created_at: new Date(row.created_at),
                approved_at: row.approved_at ? new Date(row.approved_at) : undefined,
                approved_by: row.approved_by
            }));
        } catch (error) {
            console.error('Error fetching user time entries:', error);
            throw new Error('Failed to fetch time entries');
        }
    }

    // Aktuellen Zeitkontostand eines Users abrufen (nur genehmigte Einträge)
    async getUserTimeBalance(userId: number): Promise<UserTimeBalance | null> {
        try {
            const db = await connectToDatabase();
            
            // Berechne Balance basierend auf genehmigten Einträgen
            const query = `
                SELECT 
                    ? as user_id,
                    COALESCE(SUM(hours), 0) as current_balance
                FROM time_entries 
                WHERE user_id = ? AND status = 'approved'
            `;
            
            const [rows] = await db.execute<RowDataPacket[]>(query, [userId, userId]);
            
            if (rows.length === 0) {
                return { user_id: userId, current_balance: 0.00 };
            }
            
            const row = rows[0];
            return {
                user_id: row.user_id,
                current_balance: parseFloat(row.current_balance),
                last_updated: new Date()
            };
        } catch (error) {
            console.error('Error fetching user time balance:', error);
            throw new Error('Failed to fetch time balance');
        }
    }

    // Balance für neuen User initialisieren
    private async initializeUserBalance(userId: number): Promise<void> {
        try {
            const db = await connectToDatabase();
            const query = `
                INSERT INTO user_time_balance (user_id, current_balance)
                VALUES (?, 0.00)
                ON DUPLICATE KEY UPDATE current_balance = current_balance
            `;
            
            await db.execute(query, [userId]);
        } catch (error) {
            console.error('Error initializing user balance:', error);
            throw new Error('Failed to initialize user balance');
        }
    }

    // Zeiterfassung löschen und Balance aktualisieren
    async deleteTimeEntry(entryId: number, userId: number): Promise<boolean> {
        try {
            const db = await connectToDatabase();
            
            // First get the entry to know how much to subtract from balance
            const selectQuery = `SELECT hours FROM time_entries WHERE id = ? AND user_id = ?`;
            const [entries] = await db.execute<RowDataPacket[]>(selectQuery, [entryId, userId]);
            
            if (entries.length === 0) {
                return false;
            }
            
            const hours = parseFloat(entries[0].hours);
            
            const deleteQuery = `
                DELETE FROM time_entries 
                WHERE id = ? AND user_id = ?
            `;
            
            const [result] = await db.execute<ResultSetHeader>(deleteQuery, [entryId, userId]);
            
            if (result.affectedRows > 0) {
                // Update balance by subtracting the deleted hours
                await this.updateUserBalance(userId, -hours);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error deleting time entry:', error);
            throw new Error('Failed to delete time entry');
        }
    }

    // Update user balance manually
    private async updateUserBalance(userId: number, hoursChange: number): Promise<void> {
        try {
            const db = await connectToDatabase();
            const query = `
                INSERT INTO user_time_balance (user_id, current_balance)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE
                    current_balance = current_balance + ?,
                    last_updated = CURRENT_TIMESTAMP
            `;
            
            await db.execute(query, [userId, hoursChange, hoursChange]);
        } catch (error) {
            console.error('Error updating user balance:', error);
            throw new Error('Failed to update user balance');
        }
    }

    // Manuelle Bereinigung alter Einträge (normalerweise automatisch)
    async cleanupOldEntries(): Promise<number> {
        try {
            const db = await connectToDatabase();
            
            // Get entries to be deleted first to update balances
            const selectQuery = `
                SELECT user_id, SUM(hours) as total_hours
                FROM time_entries 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK)
                GROUP BY user_id
            `;
            const [oldEntries] = await db.execute<RowDataPacket[]>(selectQuery);
            
            // Delete old entries
            const deleteQuery = `
                DELETE FROM time_entries 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK)
            `;
            const [result] = await db.execute<ResultSetHeader>(deleteQuery);
            
            // Update balances for affected users
            for (const entry of oldEntries) {
                await this.updateUserBalance(entry.user_id, -parseFloat(entry.total_hours));
            }
            
            console.log(`Cleaned up ${result.affectedRows} old time entries`);
            return result.affectedRows;
        } catch (error) {
            console.error('Error cleaning up old entries:', error);
            throw new Error('Failed to cleanup old entries');
        }
    }

    // Statistiken für Admin (nur für normale User, nicht Admins)
    async getTimeStatistics(): Promise<any> {
        try {
            const db = await connectToDatabase();
            const query = `
                SELECT 
                    u.id,
                    u.username,
                    COALESCE(SUM(CASE WHEN te.status = 'approved' THEN te.hours ELSE 0 END), 0) as current_balance,
                    COUNT(CASE WHEN te.created_at > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN te.id END) as total_entries,
                    COUNT(CASE WHEN te.status = 'pending' AND te.created_at > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN te.id END) as pending_entries,
                    SUM(CASE WHEN te.entry_type = 'productive' AND te.status = 'approved' THEN te.hours ELSE 0 END) as productive_hours,
                    SUM(CASE WHEN te.entry_type = 'screen_time' AND te.status = 'approved' THEN ABS(te.hours) ELSE 0 END) as screen_time_hours
                FROM users u
                LEFT JOIN time_entries te ON u.id = te.user_id
                WHERE u.role = 'user'
                GROUP BY u.id, u.username
                ORDER BY current_balance DESC
            `;
            
            const [rows] = await db.execute<RowDataPacket[]>(query);
            
            return rows.map((row: any) => ({
                user_id: row.id,
                username: row.username,
                current_balance: parseFloat(row.current_balance || 0),
                total_entries: row.total_entries,
                pending_entries: row.pending_entries,
                productive_hours: parseFloat(row.productive_hours || 0),
                screen_time_hours: parseFloat(row.screen_time_hours || 0)
            }));
        } catch (error) {
            console.error('Error fetching time statistics:', error);
            throw new Error('Failed to fetch statistics');
        }
    }

    // Admin: Zeiteintrag genehmigen
    async approveTimeEntry(entryId: number, adminUserId: number): Promise<boolean> {
        try {
            const db = await connectToDatabase();
            
            // Zuerst den Eintrag abrufen um die Stunden zu bekommen
            const selectQuery = `
                SELECT user_id, hours FROM time_entries 
                WHERE id = ? AND status = 'pending'
            `;
            const [entries] = await db.execute<RowDataPacket[]>(selectQuery, [entryId]);
            
            if (entries.length === 0) {
                return false; // Eintrag nicht gefunden oder bereits bearbeitet
            }
            
            const entry = entries[0];
            const userId = entry.user_id;
            const hours = parseFloat(entry.hours);
            
            // Eintrag auf genehmigt setzen
            const updateQuery = `
                UPDATE time_entries 
                SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ?
                WHERE id = ? AND status = 'pending'
            `;
            
            const [result] = await db.execute<ResultSetHeader>(updateQuery, [adminUserId, entryId]);
            
            if (result.affectedRows > 0) {
                // Balance aktualisieren
                await this.updateUserBalance(userId, hours);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error approving time entry:', error);
            throw new Error('Failed to approve time entry');
        }
    }

    // Admin: Zeiteintrag ablehnen
    async rejectTimeEntry(entryId: number, adminUserId: number): Promise<boolean> {
        try {
            const db = await connectToDatabase();
            const query = `
                UPDATE time_entries 
                SET status = 'rejected', approved_at = CURRENT_TIMESTAMP, approved_by = ?
                WHERE id = ? AND status = 'pending'
            `;
            
            const [result] = await db.execute<ResultSetHeader>(query, [adminUserId, entryId]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error rejecting time entry:', error);
            throw new Error('Failed to reject time entry');
        }
    }

    // Admin: Zeiteintrag bearbeiten (Stunden ändern)
    async updateTimeEntry(entryId: number, hours: number, adminUserId: number): Promise<boolean> {
        try {
            const db = await connectToDatabase();
            
            // Zuerst den alten Eintrag abrufen
            const selectQuery = `
                SELECT user_id, hours, status FROM time_entries 
                WHERE id = ?
            `;
            const [entries] = await db.execute<RowDataPacket[]>(selectQuery, [entryId]);
            
            if (entries.length === 0) {
                return false;
            }
            
            const entry = entries[0];
            const userId = entry.user_id;
            const oldHours = parseFloat(entry.hours);
            const oldStatus = entry.status;
            
            // Eintrag aktualisieren und genehmigen
            const updateQuery = `
                UPDATE time_entries 
                SET hours = ?, status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ?
                WHERE id = ?
            `;
            
            const [result] = await db.execute<ResultSetHeader>(updateQuery, [hours, adminUserId, entryId]);
            
            if (result.affectedRows > 0) {
                // Balance aktualisieren
                if (oldStatus === 'approved') {
                    // Wenn bereits genehmigt war, alte Stunden abziehen und neue hinzufügen
                    const hoursDifference = hours - oldHours;
                    await this.updateUserBalance(userId, hoursDifference);
                } else {
                    // Wenn noch nicht genehmigt war, nur neue Stunden hinzufügen
                    await this.updateUserBalance(userId, hours);
                }
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error updating time entry:', error);
            throw new Error('Failed to update time entry');
        }
    }

    // Admin: Alle wartenden Einträge abrufen
    async getPendingTimeEntries(): Promise<TimeEntry[]> {
        try {
            const db = await connectToDatabase();
            const query = `
                SELECT te.id, te.user_id, te.hours, te.entry_type, te.description, te.status, te.created_at,
                       u.username
                FROM time_entries te
                JOIN users u ON te.user_id = u.id
                WHERE te.status = 'pending'
                ORDER BY te.created_at ASC
            `;
            
            const [rows] = await db.execute<RowDataPacket[]>(query);
            
            return rows.map((row: any) => ({
                id: row.id,
                user_id: row.user_id,
                username: row.username,
                hours: parseFloat(row.hours),
                entry_type: row.entry_type,
                description: row.description,
                status: row.status,
                created_at: new Date(row.created_at)
            } as any));
        } catch (error) {
            console.error('Error fetching pending time entries:', error);
            throw new Error('Failed to fetch pending entries');
        }
    }

    // Admin: Einzelnen Zeiteintrag löschen (auch genehmigte) und Balance aktualisieren
    async adminDeleteTimeEntry(entryId: number): Promise<boolean> {
        try {
            const db = await connectToDatabase();
            
            // Zuerst den Eintrag abrufen um die Stunden und den Status zu bekommen
            const selectQuery = `
                SELECT user_id, hours, status FROM time_entries 
                WHERE id = ?
            `;
            const [entries] = await db.execute<RowDataPacket[]>(selectQuery, [entryId]);
            
            if (entries.length === 0) {
                return false; // Eintrag nicht gefunden
            }
            
            const entry = entries[0];
            const userId = entry.user_id;
            const hours = parseFloat(entry.hours);
            const status = entry.status;
            
            // Eintrag löschen
            const deleteQuery = `
                DELETE FROM time_entries 
                WHERE id = ?
            `;
            
            const [result] = await db.execute<ResultSetHeader>(deleteQuery, [entryId]);
            
            if (result.affectedRows > 0) {
                // Balance nur aktualisieren wenn der Eintrag genehmigt war
                if (status === 'approved') {
                    await this.updateUserBalance(userId, -hours);
                }
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error deleting time entry (admin):', error);
            throw new Error('Failed to delete time entry');
        }
    }
}