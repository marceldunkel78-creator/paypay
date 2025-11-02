"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdTaskService = void 0;
const db_1 = require("../db");
class HouseholdTaskService {
    // Alle aktiven Hausarbeiten für User abrufen (alphabetisch sortiert)
    getActiveHouseholdTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, db_1.connectToDatabase)();
                const query = `
                SELECT id, name, hours, is_active, created_at, updated_at
                FROM household_tasks 
                WHERE is_active = TRUE
                ORDER BY name ASC
            `;
                const [rows] = yield db.execute(query);
                return rows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    hours: parseFloat(row.hours),
                    is_active: row.is_active,
                    created_at: new Date(row.created_at),
                    updated_at: new Date(row.updated_at)
                }));
            }
            catch (error) {
                console.error('Error fetching active household tasks:', error);
                throw new Error('Failed to fetch household tasks');
            }
        });
    }
    // Alle Hausarbeiten für Admin abrufen (alphabetisch sortiert)
    getAllHouseholdTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, db_1.connectToDatabase)();
                const query = `
                SELECT id, name, hours, is_active, created_at, updated_at
                FROM household_tasks 
                ORDER BY name ASC
            `;
                const [rows] = yield db.execute(query);
                return rows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    hours: parseFloat(row.hours),
                    is_active: row.is_active,
                    created_at: new Date(row.created_at),
                    updated_at: new Date(row.updated_at)
                }));
            }
            catch (error) {
                console.error('Error fetching all household tasks:', error);
                throw new Error('Failed to fetch household tasks');
            }
        });
    }
    // Einzelne Hausarbeit abrufen
    getHouseholdTaskById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, db_1.connectToDatabase)();
                const query = `
                SELECT id, name, hours, is_active, created_at, updated_at
                FROM household_tasks 
                WHERE id = ?
            `;
                const [rows] = yield db.execute(query, [id]);
                if (rows.length === 0) {
                    return null;
                }
                const row = rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    hours: parseFloat(row.hours),
                    is_active: row.is_active,
                    created_at: new Date(row.created_at),
                    updated_at: new Date(row.updated_at)
                };
            }
            catch (error) {
                console.error('Error fetching household task by id:', error);
                throw new Error('Failed to fetch household task');
            }
        });
    }
    // Neue Hausarbeit erstellen (Admin)
    createHouseholdTask(taskData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, db_1.connectToDatabase)();
                const query = `
                INSERT INTO household_tasks (name, hours, is_active)
                VALUES (?, ?, ?)
            `;
                const [result] = yield db.execute(query, [taskData.name, taskData.hours, (_a = taskData.is_active) !== null && _a !== void 0 ? _a : true]);
                console.log('Household task created:', result.insertId);
                // Neu erstellte Hausarbeit zurückgeben
                const createdTask = yield this.getHouseholdTaskById(result.insertId);
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
        });
    }
    // Hausarbeit aktualisieren (Admin)
    updateHouseholdTask(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, db_1.connectToDatabase)();
                // Dynamische Query basierend auf übergebenen Feldern
                const updateFields = [];
                const updateValues = [];
                if (updateData.name !== undefined) {
                    updateFields.push('name = ?');
                    updateValues.push(updateData.name);
                }
                if (updateData.hours !== undefined) {
                    updateFields.push('hours = ?');
                    updateValues.push(updateData.hours);
                }
                if (updateData.is_active !== undefined) {
                    updateFields.push('is_active = ?');
                    updateValues.push(updateData.is_active);
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
                const [result] = yield db.execute(query, updateValues);
                return result.affectedRows > 0;
            }
            catch (error) {
                console.error('Error updating household task:', error);
                if (error instanceof Error && error.message.includes('Duplicate entry')) {
                    throw new Error('Eine Hausarbeit mit diesem Namen existiert bereits');
                }
                throw new Error('Failed to update household task');
            }
        });
    }
    // Hausarbeit löschen (Admin) - nur wenn keine Zeiteinträge damit verknüpft sind
    deleteHouseholdTask(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, db_1.connectToDatabase)();
                // Prüfen ob Zeiteinträge mit dieser Hausarbeit existieren
                const checkQuery = `
                SELECT COUNT(*) as count 
                FROM time_entries 
                WHERE task_id = ?
            `;
                const [checkResult] = yield db.execute(checkQuery, [id]);
                const entryCount = checkResult[0].count;
                if (entryCount > 0) {
                    throw new Error('Hausarbeit kann nicht gelöscht werden, da Zeiteinträge damit verknüpft sind');
                }
                const deleteQuery = `
                DELETE FROM household_tasks 
                WHERE id = ?
            `;
                const [result] = yield db.execute(deleteQuery, [id]);
                return result.affectedRows > 0;
            }
            catch (error) {
                console.error('Error deleting household task:', error);
                throw error; // Re-throw to preserve specific error messages
            }
        });
    }
    // Hausarbeit deaktivieren statt löschen (safer option)
    deactivateHouseholdTask(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.updateHouseholdTask(id, { is_active: false });
            }
            catch (error) {
                console.error('Error deactivating household task:', error);
                throw new Error('Failed to deactivate household task');
            }
        });
    }
}
exports.HouseholdTaskService = HouseholdTaskService;
