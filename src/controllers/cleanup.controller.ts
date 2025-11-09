// Temporary admin script to clean household_tasks duplicates
// Access via: GET http://localhost:3000/api/admin/clean-duplicates

import { Request, Response } from 'express';
import { connectToDatabase } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const cleanHouseholdTaskDuplicates = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check if user is admin
        const user_role = (req as any).user?.role;
        if (user_role !== 'admin') {
            res.status(403).json({ error: 'Keine Berechtigung' });
            return;
        }

        const db = await connectToDatabase();

        // Check current state
        const [countRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM household_tasks');
        const countBefore = countRows[0].count;

        // Show duplicates
        const [duplicateRows] = await db.execute<RowDataPacket[]>(`
            SELECT name, COUNT(*) as count 
            FROM household_tasks 
            GROUP BY name 
            HAVING COUNT(*) > 1 
            ORDER BY count DESC
        `);
        
        let deletedCount = 0;
        if (duplicateRows.length > 0) {
            // Delete duplicates, keeping only the first one (lowest id) for each name
            const [result] = await db.execute<ResultSetHeader>(`
                DELETE t1 FROM household_tasks t1 
                INNER JOIN household_tasks t2 
                WHERE t1.id > t2.id AND t1.name = t2.name
            `);
            
            deletedCount = result.affectedRows;
        }

        // Check final state
        const [finalCountRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM household_tasks');
        const countAfter = finalCountRows[0].count;

        // Get final results
        const [finalRows] = await db.execute<RowDataPacket[]>('SELECT id, name, weight_factor FROM household_tasks ORDER BY name');

        res.json({
            message: 'Duplicate cleanup completed',
            countBefore,
            countAfter,
            deletedCount,
            duplicatesFound: duplicateRows,
            finalTasks: finalRows
        });

    } catch (error) {
        console.error('Error cleaning duplicates:', error);
        res.status(500).json({ error: 'Fehler beim Bereinigen der Duplikate' });
    }
};