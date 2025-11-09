import { connectToDatabase } from '../db';
import { TimeEntry, UserTimeBalance } from '../models/timeentry.model';
import { HouseholdTaskService } from './household-task.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class TimeEntryService {
    private householdTaskService: HouseholdTaskService;
    
    constructor() {
        this.householdTaskService = new HouseholdTaskService();
    }
    
    // Neue Zeiterfassung erstellen (positiv oder negativ) - Status: pending
    async createTimeEntry(timeEntry: Omit<TimeEntry, 'id' | 'created_at'>): Promise<TimeEntry & { task_name?: string }> {
        try {
            const db = await connectToDatabase();
            
            let finalHours = timeEntry.hours;
            let calculatedHours: number | null = null;
            let taskName: string | undefined;
            
            // Wenn task_id gegeben ist, Stunden aus Hausarbeiten-Tabelle laden
            if (timeEntry.task_id) {
                const task = await this.householdTaskService.getHouseholdTaskById(timeEntry.task_id);
                if (!task) {
                    throw new Error('Hausarbeit nicht gefunden');
                }
                if (!task.is_active) {
                    throw new Error('Hausarbeit ist nicht aktiv');
                }
                
                taskName = task.name; // Task-Name für die E-Mail speichern
                
                if (timeEntry.entry_type === 'productive' && timeEntry.input_minutes) {
                    // Neue Weight Factor Berechnung für produktive Zeit
                    const inputMinutes = timeEntry.input_minutes;
                    const weightFactor = task.weight_factor;
                    calculatedHours = (inputMinutes * weightFactor) / 60; // Konvertierung zu Stunden
                    finalHours = calculatedHours;
                } else if (timeEntry.entry_type === 'screen_time') {
                    // Bildschirmzeit: verwende input_minutes mit weight_factor (als negative Stunden)
                    const inputMinutes = timeEntry.input_minutes || 0;
                    const weightFactor = task.weight_factor;
                    calculatedHours = (inputMinutes * weightFactor) / 60;
                    finalHours = -Math.abs(calculatedHours); // Negativ für Bildschirmzeit
                } else {
                    throw new Error('Ungültige Eingabe für task-basierte Zeiterfassung');
                }
            } else {
                // Für manuelle Eingaben: Stunden direkt verwenden (nur für screen_time erlaubt)
                finalHours = timeEntry.hours;
                
                // Validierung: Manuelle Eingaben sind nur für screen_time erlaubt
                if (timeEntry.entry_type !== 'screen_time') {
                    throw new Error('Manuelle Stundeneingabe nur für Bildschirmzeit erlaubt');
                }
                
                // Sicherstellen, dass manuelle screen_time negative Werte hat
                if (finalHours >= 0) {
                    throw new Error('Bildschirmzeit muss negativ sein');
                }
            }
            
            const query = `
                INSERT INTO time_entries (user_id, task_id, hours, entry_type, description, status, input_minutes, calculated_hours)
                VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
            `;
            
            const [result] = await db.execute<ResultSetHeader>(
                query,
                [
                    timeEntry.user_id, 
                    timeEntry.task_id || null, 
                    finalHours, 
                    timeEntry.entry_type, 
                    timeEntry.description || null,
                    timeEntry.input_minutes || null,
                    calculatedHours
                ]
            );

            console.log('Time entry created (pending approval):', result.insertId);

            // NICHT die Balance aktualisieren - erst bei Genehmigung!

            // Neu erstellten Eintrag zurückgeben
            return {
                id: result.insertId,
                ...timeEntry,
                hours: finalHours,
                calculated_hours: calculatedHours,
                status: 'pending',
                created_at: new Date(),
                task_name: taskName
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
                SELECT te.id, te.user_id, te.task_id, te.hours, te.entry_type, te.description, 
                       te.status, te.created_at,
                       te.input_minutes, te.calculated_hours,
                       ht.name as task_name
                FROM time_entries te
                LEFT JOIN household_tasks ht ON te.task_id = ht.id
                WHERE te.user_id = ?
            `;
            
            const params: any[] = [userId];
            
            if (status) {
                query += ` AND te.status = ?`;
                params.push(status);
            }
            
            query += ` ORDER BY te.created_at DESC LIMIT ${safeLimit}`;
            
            const [rows] = await db.execute<RowDataPacket[]>(query, params);
            
            return rows.map((row: any) => ({
                id: row.id,
                user_id: row.user_id,
                task_id: row.task_id,
                hours: parseFloat(row.hours),
                entry_type: row.entry_type,
                description: row.description,
                status: row.status,
                created_at: new Date(row.created_at),

                input_minutes: row.input_minutes,
                calculated_hours: row.calculated_hours ? parseFloat(row.calculated_hours) : null,
                task_name: row.task_name // Name der Hausarbeit
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

    // Admin cleanup - removes old entries WITHOUT updating balance
    async adminCleanupOldEntries(): Promise<number> {
        try {
            const db = await connectToDatabase();
            
            // Delete old entries without affecting user balances
            const deleteQuery = `
                DELETE FROM time_entries 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK)
            `;
            const [result] = await db.execute<ResultSetHeader>(deleteQuery);
            
            console.log(`Admin cleanup: removed ${result.affectedRows} old time entries (balance unchanged)`);
            return result.affectedRows;
        } catch (error) {
            console.error('Error in admin cleanup:', error);
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
                    COALESCE(utb.current_balance, 0) as current_balance,
                    COUNT(CASE WHEN te.created_at > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN te.id END) as total_entries,
                    COUNT(CASE WHEN te.status = 'pending' AND te.created_at > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN te.id END) as pending_entries,
                    SUM(CASE WHEN te.entry_type = 'productive' AND te.status = 'approved' THEN te.hours ELSE 0 END) as productive_hours,
                    SUM(CASE WHEN te.entry_type = 'screen_time' AND te.status = 'approved' THEN ABS(te.hours) ELSE 0 END) as screen_time_hours
                FROM users u
                LEFT JOIN time_entries te ON u.id = te.user_id AND te.created_at > DATE_SUB(NOW(), INTERVAL 1 WEEK)
                LEFT JOIN user_time_balance utb ON u.id = utb.user_id
                WHERE u.role = 'user'
                GROUP BY u.id, u.username, utb.current_balance
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
    async approveTimeEntry(entryId: number, adminUserId: number): Promise<{success: boolean, userEmail?: string}> {
        try {
            const db = await connectToDatabase();
            
            // Zuerst den Eintrag abrufen um die Stunden und Benutzer-E-Mail zu bekommen
            const selectQuery = `
                SELECT te.user_id, te.hours, u.email as userEmail 
                FROM time_entries te 
                JOIN users u ON te.user_id = u.id
                WHERE te.id = ? AND te.status = 'pending'
            `;
            const [entries] = await db.execute<RowDataPacket[]>(selectQuery, [entryId]);
            
            if (entries.length === 0) {
                return {success: false}; // Eintrag nicht gefunden oder bereits bearbeitet
            }
            
            const entry = entries[0];
            const userId = entry.user_id;
            const hours = parseFloat(entry.hours);
            const userEmail = entry.userEmail;
            
            // Eintrag auf genehmigt setzen
            const updateQuery = `
                UPDATE time_entries 
                SET status = 'approved'
                WHERE id = ? AND status = 'pending'
            `;
            
            const [result] = await db.execute<ResultSetHeader>(updateQuery, [entryId]);
            
            if (result.affectedRows > 0) {
                // Balance aktualisieren
                await this.updateUserBalance(userId, hours);
                return {success: true, userEmail};
            }
            
            return {success: false};
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
                SET status = 'rejected'
                WHERE id = ? AND status = 'pending'
            `;
            
            const [result] = await db.execute<ResultSetHeader>(query, [entryId]);
            
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
                SET hours = ?, status = 'approved'
                WHERE id = ?
            `;
            
            const [result] = await db.execute<ResultSetHeader>(updateQuery, [hours, entryId]);
            
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

    // Admin: Update time entry by minutes (for Weight Factor entries)
    async updateTimeEntryByMinutes(entryId: number, inputMinutes: number, adminUserId: number): Promise<boolean> {
        try {
            const db = await connectToDatabase();
            
            // Zuerst den alten Eintrag und die zugehörige Hausarbeit abrufen
            const selectQuery = `
                SELECT te.user_id, te.hours, te.status, te.task_id, te.input_minutes, te.calculated_hours,
                       ht.weight_factor
                FROM time_entries te
                LEFT JOIN household_tasks ht ON te.task_id = ht.id
                WHERE te.id = ?
            `;
            const [entries] = await db.execute<RowDataPacket[]>(selectQuery, [entryId]);
            
            if (entries.length === 0) {
                return false;
            }
            
            const entry = entries[0];
            const userId = entry.user_id;
            const oldHours = parseFloat(entry.hours);
            const oldStatus = entry.status;
            const weightFactor = parseFloat(entry.weight_factor) || 1.0;
            
            // Neue Stunden basierend auf Minuten und Weight Factor berechnen
            const calculatedHours = (inputMinutes * weightFactor) / 60;
            
            // Eintrag aktualisieren und genehmigen
            const updateQuery = `
                UPDATE time_entries 
                SET input_minutes = ?, calculated_hours = ?, hours = ?, 
                    status = 'approved'
                WHERE id = ?
            `;
            
            const [result] = await db.execute<ResultSetHeader>(updateQuery, [
                inputMinutes, calculatedHours, calculatedHours, entryId
            ]);
            
            if (result.affectedRows > 0) {
                // Balance aktualisieren
                if (oldStatus === 'approved') {
                    // Wenn bereits genehmigt war, alte Stunden abziehen und neue hinzufügen
                    const hoursDifference = calculatedHours - oldHours;
                    await this.updateUserBalance(userId, hoursDifference);
                } else {
                    // Wenn noch nicht genehmigt war, nur neue Stunden hinzufügen
                    await this.updateUserBalance(userId, calculatedHours);
                }
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error updating time entry by minutes:', error);
            throw new Error('Failed to update time entry by minutes');
        }
    }

    // Admin: Alle wartenden Einträge abrufen
    async getPendingTimeEntries(): Promise<TimeEntry[]> {
        try {
            const db = await connectToDatabase();
            const query = `
                SELECT te.id, te.user_id, te.task_id, te.hours, te.entry_type, te.description, 
                       te.status, te.created_at, te.input_minutes, te.calculated_hours,
                       u.username,
                       ht.name as task_name
                FROM time_entries te
                JOIN users u ON te.user_id = u.id
                LEFT JOIN household_tasks ht ON te.task_id = ht.id
                WHERE te.status = 'pending'
                ORDER BY te.created_at ASC
            `;
            
            const [rows] = await db.execute<RowDataPacket[]>(query);
            
            return rows.map((row: any) => ({
                id: row.id,
                user_id: row.user_id,
                task_id: row.task_id,
                username: row.username,
                hours: parseFloat(row.hours),
                entry_type: row.entry_type,
                description: row.description,
                status: row.status,
                created_at: new Date(row.created_at),
                input_minutes: row.input_minutes,
                calculated_hours: row.calculated_hours ? parseFloat(row.calculated_hours) : null,
                task_name: row.task_name
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

    // Get user details by ID
    async getUserById(userId: number): Promise<{username: string, email: string} | null> {
        try {
            const db = await connectToDatabase();
            const [rows] = await db.execute<RowDataPacket[]>(
                'SELECT username, email FROM users WHERE id = ?',
                [userId]
            );
            
            if (rows.length === 0) {
                return null;
            }
            
            return {
                username: rows[0].username,
                email: rows[0].email
            };
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            return null;
        }
    }
}