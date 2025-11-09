"use strict";
// Temporary admin script to clean household_tasks duplicates
// Access via: GET http://localhost:3000/api/admin/clean-duplicates
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanHouseholdTaskDuplicates = void 0;
const db_1 = require("../db");
const cleanHouseholdTaskDuplicates = async (req, res) => {
    var _a;
    try {
        // Check if user is admin
        const user_role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (user_role !== 'admin') {
            res.status(403).json({ error: 'Keine Berechtigung' });
            return;
        }
        const db = await (0, db_1.connectToDatabase)();
        // Check current state
        const [countRows] = await db.execute('SELECT COUNT(*) as count FROM household_tasks');
        const countBefore = countRows[0].count;
        // Show duplicates
        const [duplicateRows] = await db.execute(`
            SELECT name, COUNT(*) as count 
            FROM household_tasks 
            GROUP BY name 
            HAVING COUNT(*) > 1 
            ORDER BY count DESC
        `);
        let deletedCount = 0;
        if (duplicateRows.length > 0) {
            // Delete duplicates, keeping only the first one (lowest id) for each name
            const [result] = await db.execute(`
                DELETE t1 FROM household_tasks t1 
                INNER JOIN household_tasks t2 
                WHERE t1.id > t2.id AND t1.name = t2.name
            `);
            deletedCount = result.affectedRows;
        }
        // Check final state
        const [finalCountRows] = await db.execute('SELECT COUNT(*) as count FROM household_tasks');
        const countAfter = finalCountRows[0].count;
        // Get final results
        const [finalRows] = await db.execute('SELECT id, name, weight_factor FROM household_tasks ORDER BY name');
        res.json({
            message: 'Duplicate cleanup completed',
            countBefore,
            countAfter,
            deletedCount,
            duplicatesFound: duplicateRows,
            finalTasks: finalRows
        });
    }
    catch (error) {
        console.error('Error cleaning duplicates:', error);
        res.status(500).json({ error: 'Fehler beim Bereinigen der Duplikate' });
    }
};
exports.cleanHouseholdTaskDuplicates = cleanHouseholdTaskDuplicates;
//# sourceMappingURL=cleanup.controller.js.map