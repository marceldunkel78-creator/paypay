"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdTaskService = void 0;
const db_1 = require("../db");
class HouseholdTaskService {
    // Alle aktiven Hausarbeiten für User abrufen (alphabetisch sortiert)
    async getActiveHouseholdTasks() {
        try {
            const db = await (0, db_1.connectToDatabase)();
            const query = `
                SELECT id, name, description, hours, weight_factor, is_active, created_at, updated_at
                FROM household_tasks 
                WHERE is_active = 1 
                ORDER BY name ASC
            `;
            const [rows] = await db.execute(query);
            return rows.map((row) => ({
                id: row.id,
                name: row.name,
                description: row.description,
                hours: row.hours ? parseFloat(row.hours) : null,
                weight_factor: parseFloat(row.weight_factor),
                is_active: row.is_active,
                created_at: new Date(row.created_at),
                updated_at: new Date(row.updated_at)
            }));
        }
        catch (error) {
            console.error('Error fetching active household tasks:', error);
            throw new Error('Failed to fetch household tasks');
        }
    }
    // Alle Hausarbeiten für Admin abrufen (alphabetisch sortiert)
    async getAllHouseholdTasks() {
        try {
            const db = await (0, db_1.connectToDatabase)();
            const query = `
                SELECT id, name, description, hours, weight_factor, is_active, created_at, updated_at
                FROM household_tasks 
                ORDER BY name ASC
            `;
            const [rows] = await db.execute(query);
            return rows.map((row) => ({
                id: row.id,
                name: row.name,
                description: row.description,
                hours: row.hours ? parseFloat(row.hours) : null,
                weight_factor: parseFloat(row.weight_factor),
                is_active: row.is_active,
                created_at: new Date(row.created_at),
                updated_at: new Date(row.updated_at)
            }));
        }
        catch (error) {
            console.error('Error fetching all household tasks:', error);
            throw new Error('Failed to fetch household tasks');
        }
    }
    // Einzelne Hausarbeit abrufen
    async getHouseholdTaskById(id) {
        try {
            const db = await (0, db_1.connectToDatabase)();
            const query = `
                SELECT id, name, description, hours, weight_factor, is_active, created_at, updated_at
                FROM household_tasks 
                WHERE id = ?
            `;
            const [rows] = await db.execute(query, [id]);
            if (rows.length === 0) {
                return null;
            }
            const row = rows[0];
            return {
                id: row.id,
                name: row.name,
                description: row.description,
                hours: row.hours ? parseFloat(row.hours) : null,
                weight_factor: parseFloat(row.weight_factor),
                is_active: row.is_active,
                created_at: new Date(row.created_at),
                updated_at: new Date(row.updated_at)
            };
        }
        catch (error) {
            console.error('Error fetching household task by id:', error);
            throw new Error('Failed to fetch household task');
        }
    }
    // Neue Hausarbeit erstellen (Admin)
    async createHouseholdTask(taskData) {
        var _a, _b, _c, _d;
        try {
            const db = await (0, db_1.connectToDatabase)();
            const query = `
                INSERT INTO household_tasks (name, description, hours, weight_factor, is_active)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(query, [taskData.name, (_a = taskData.description) !== null && _a !== void 0 ? _a : null, (_b = taskData.hours) !== null && _b !== void 0 ? _b : null, (_c = taskData.weight_factor) !== null && _c !== void 0 ? _c : 1.00, (_d = taskData.is_active) !== null && _d !== void 0 ? _d : true]);
            console.log('Household task created:', result.insertId);
            // Neu erstellte Hausarbeit zurückgeben
            const createdTask = await this.getHouseholdTaskById(result.insertId);
            if (!createdTask) {
                throw new Error('Failed to retrieve created household task');
            }
            return createdTask;
        }
        catch (error) {
            console.error('Error creating household task:', error);
            if (error instanceof Error && error.message.includes('Duplicate entry')) {
                throw new Error('Eine Hausarbeit mit diesem Namen existiert bereits');
            }
            throw new Error('Failed to create household task');
        }
    }
    // Hausarbeit aktualisieren (Admin)
    async updateHouseholdTask(id, updateData) {
        try {
            const db = await (0, db_1.connectToDatabase)();
            // Dynamische Query basierend auf übergebenen Feldern
            const updateFields = [];
            const updateValues = [];
            if (updateData.name !== undefined) {
                updateFields.push('name = ?');
                updateValues.push(updateData.name);
            }
            if (updateData.description !== undefined) {
                updateFields.push('description = ?');
                updateValues.push(updateData.description);
            }
            if (updateData.hours !== undefined) {
                updateFields.push('hours = ?');
                updateValues.push(updateData.hours);
            }
            if (updateData.is_active !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(updateData.is_active);
            }
            if (updateData.weight_factor !== undefined) {
                updateFields.push('weight_factor = ?');
                updateValues.push(updateData.weight_factor);
            }
            if (updateFields.length === 0) {
                return false; // Keine Änderungen
            }
            updateValues.push(id);
            const query = `
                UPDATE household_tasks 
                SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            const [result] = await db.execute(query, updateValues);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating household task:', error);
            if (error instanceof Error && error.message.includes('Duplicate entry')) {
                throw new Error('Eine Hausarbeit mit diesem Namen existiert bereits');
            }
            throw new Error('Failed to update household task');
        }
    }
    // Hausarbeit löschen (Admin) - nur wenn keine Zeiteinträge damit verknüpft sind
    async deleteHouseholdTask(id) {
        try {
            const db = await (0, db_1.connectToDatabase)();
            // Prüfen ob Zeiteinträge mit dieser Hausarbeit existieren
            const checkQuery = `
                SELECT COUNT(*) as count 
                FROM time_entries 
                WHERE task_id = ?
            `;
            const [checkResult] = await db.execute(checkQuery, [id]);
            const entryCount = checkResult[0].count;
            if (entryCount > 0) {
                throw new Error('Hausarbeit kann nicht gelöscht werden, da Zeiteinträge damit verknüpft sind');
            }
            const deleteQuery = `
                DELETE FROM household_tasks 
                WHERE id = ?
            `;
            const [result] = await db.execute(deleteQuery, [id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error deleting household task:', error);
            throw error; // Re-throw to preserve specific error messages
        }
    }
    // Hausarbeit deaktivieren statt löschen (safer option)
    async deactivateHouseholdTask(id) {
        try {
            return await this.updateHouseholdTask(id, { is_active: false });
        }
        catch (error) {
            console.error('Error deactivating household task:', error);
            throw new Error('Failed to deactivate household task');
        }
    }
    // Weight Factor für eine Hausarbeit aktualisieren
    async updateWeightFactor(id, weightFactor) {
        try {
            const db = await (0, db_1.connectToDatabase)();
            // Validierung
            if (weightFactor <= 0 || weightFactor > 5) {
                throw new Error('Weight factor must be between 0.01 and 5.00');
            }
            const query = `
                UPDATE household_tasks 
                SET weight_factor = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            const [result] = await db.execute(query, [weightFactor, id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error updating weight factor:', error);
            throw error; // Re-throw to preserve specific error messages
        }
    }
}
exports.HouseholdTaskService = HouseholdTaskService;
//# sourceMappingURL=household-task.service.js.map