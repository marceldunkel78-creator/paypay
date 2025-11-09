import { Request, Response } from 'express';
import { HouseholdTaskService } from '../services/household-task.service';
import { CreateHouseholdTaskRequest, UpdateHouseholdTaskRequest } from '../models/household-task.model';

export class HouseholdTaskController {
    private householdTaskService: HouseholdTaskService;

    constructor() {
        this.householdTaskService = new HouseholdTaskService();
    }

    // Aktive Hausarbeiten für User abrufen
    async getActiveHouseholdTasks(req: Request, res: Response): Promise<void> {
        try {
            const tasks = await this.householdTaskService.getActiveHouseholdTasks();
            res.json(tasks);
        } catch (error) {
            console.error('Error fetching active household tasks:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Hausarbeiten' });
        }
    }

    // Alle Hausarbeiten für Admin abrufen
    async getAllHouseholdTasks(req: Request, res: Response): Promise<void> {
        try {
            const user_role = (req as any).user?.role;

            if (user_role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const tasks = await this.householdTaskService.getAllHouseholdTasks();
            res.json(tasks);
        } catch (error) {
            console.error('Error fetching all household tasks:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Hausarbeiten' });
        }
    }

    // Einzelne Hausarbeit abrufen
    async getHouseholdTaskById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user_role = (req as any).user?.role;

            if (user_role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const task = await this.householdTaskService.getHouseholdTaskById(parseInt(id));
            
            if (!task) {
                res.status(404).json({ error: 'Hausarbeit nicht gefunden' });
                return;
            }

            res.json(task);
        } catch (error) {
            console.error('Error fetching household task:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Hausarbeit' });
        }
    }

    // Neue Hausarbeit erstellen (Admin)
    async createHouseholdTask(req: Request, res: Response): Promise<void> {
        try {
            const { name, description, hours, weight_factor, is_active } = req.body;
            const user_role = (req as any).user?.role;

            if (user_role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                res.status(400).json({ error: 'Name ist erforderlich' });
                return;
            }

            const taskData: CreateHouseholdTaskRequest = {
                name: name.trim(),
                description: description || '',
                hours: hours ? parseFloat(hours) : null,
                weight_factor: weight_factor ? parseFloat(weight_factor) : 1.00,
                is_active: is_active ?? true
            };

            const createdTask = await this.householdTaskService.createHouseholdTask(taskData);
            res.status(201).json({
                message: 'Hausarbeit erfolgreich erstellt',
                task: createdTask
            });
        } catch (error) {
            console.error('Error creating household task:', error);
            const errorMessage = error instanceof Error ? error.message : 'Fehler beim Erstellen der Hausarbeit';
            res.status(400).json({ error: errorMessage });
        }
    }

    // Hausarbeit aktualisieren (Admin)
    async updateHouseholdTask(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, description, hours, weight_factor, is_active } = req.body;
            const user_role = (req as any).user?.role;

            if (user_role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const updateData: UpdateHouseholdTaskRequest = {};

            if (name !== undefined) {
                updateData.name = name.trim();
            }

            if (description !== undefined) {
                updateData.description = description;
            }

            if (hours !== undefined) {
                updateData.hours = parseFloat(hours);
            }

            if (is_active !== undefined) {
                updateData.is_active = Boolean(is_active);
            }

            if (weight_factor !== undefined) {
                updateData.weight_factor = parseFloat(weight_factor);
            }

            const success = await this.householdTaskService.updateHouseholdTask(parseInt(id), updateData);
            
            if (success) {
                res.json({ message: 'Hausarbeit erfolgreich aktualisiert' });
            } else {
                res.status(404).json({ error: 'Hausarbeit nicht gefunden oder keine Änderungen' });
            }
        } catch (error) {
            console.error('Error updating household task:', error);
            const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Hausarbeit';
            res.status(400).json({ error: errorMessage });
        }
    }

    // Hausarbeit löschen (Admin)
    async deleteHouseholdTask(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user_role = (req as any).user?.role;

            if (user_role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const success = await this.householdTaskService.deleteHouseholdTask(parseInt(id));
            
            if (success) {
                res.json({ message: 'Hausarbeit erfolgreich gelöscht' });
            } else {
                res.status(404).json({ error: 'Hausarbeit nicht gefunden' });
            }
        } catch (error) {
            console.error('Error deleting household task:', error);
            const errorMessage = error instanceof Error ? error.message : 'Fehler beim Löschen der Hausarbeit';
            res.status(400).json({ error: errorMessage });
        }
    }

    // Hausarbeit deaktivieren (Admin)
    async deactivateHouseholdTask(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user_role = (req as any).user?.role;

            if (user_role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const success = await this.householdTaskService.deactivateHouseholdTask(parseInt(id));
            
            if (success) {
                res.json({ message: 'Hausarbeit erfolgreich deaktiviert' });
            } else {
                res.status(404).json({ error: 'Hausarbeit nicht gefunden' });
            }
        } catch (error) {
            console.error('Error deactivating household task:', error);
            res.status(500).json({ error: 'Fehler beim Deaktivieren der Hausarbeit' });
        }
    }
}