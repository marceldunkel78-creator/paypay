import { Request, Response } from 'express';
import { TimeEntryService } from '../services/timeentry.service';
import { TimeEntry } from '../models/timeentry.model';

export class TimeEntryController {
    private timeEntryService: TimeEntryService;

    constructor() {
        this.timeEntryService = new TimeEntryService();
    }

    // Neue Zeiterfassung erstellen (Status: pending)
    async createTimeEntry(req: Request, res: Response): Promise<void> {
        try {
            const { task_id, entry_type, description, hours } = req.body;
            const user_id = (req as any).user?.id;
            const user_role = (req as any).user?.role;

            if (!user_id) {
                res.status(401).json({ error: 'Nicht authentifiziert' });
                return;
            }

            // Admins können keine eigenen Zeiteinträge erstellen
            if (user_role === 'admin') {
                res.status(403).json({ error: 'Admins können keine Zeiteinträge erstellen' });
                return;
            }

            if (!entry_type) {
                res.status(400).json({ error: 'Eintragstyp ist erforderlich' });
                return;
            }

            if (!['productive', 'screen_time'].includes(entry_type)) {
                res.status(400).json({ error: 'Ungültiger Eintragstyp' });
                return;
            }

            // Validation: Either task_id or manual hours must be provided
            if (!task_id && !hours) {
                res.status(400).json({ error: 'Entweder Hausarbeit oder manuelle Stundeneingabe ist erforderlich' });
                return;
            }

            // Validation: If hours provided, it must be for screen_time and negative
            if (hours !== undefined) {
                if (entry_type !== 'screen_time') {
                    res.status(400).json({ error: 'Manuelle Stundeneingabe nur für Bildschirmzeit erlaubt' });
                    return;
                }
                if (typeof hours !== 'number' || hours >= 0) {
                    res.status(400).json({ error: 'Bildschirmzeit muss als negative Zahl angegeben werden' });
                    return;
                }
            }

            const timeEntry: Omit<TimeEntry, 'id' | 'created_at' | 'approved_at' | 'approved_by'> = {
                user_id,
                task_id: task_id ? parseInt(task_id) : undefined,
                hours: hours || 0, // Use provided hours or 0 (will be set by service for task-based entries)
                entry_type,
                description: description || '',
                status: 'pending'
            };

            const createdEntry = await this.timeEntryService.createTimeEntry(timeEntry);
            res.status(201).json({
                message: 'Zeiterfassung erstellt und wartet auf Genehmigung',
                timeEntry: createdEntry
            });
        } catch (error) {
            console.error('Error creating time entry:', error);
            res.status(500).json({ error: 'Fehler beim Erstellen der Zeiterfassung' });
        }
    }

    // Zeiteinträge eines Users abrufen
    async getUserTimeEntries(req: Request, res: Response): Promise<void> {
        try {
            const user_id = (req as any).user?.id;
            const user_role = (req as any).user?.role;
            const limit = parseInt(req.query.limit as string) || 50;
            const status = req.query.status as string;
            const targetUserId = req.query.userId ? parseInt(req.query.userId as string) : user_id;

            if (!user_id) {
                res.status(401).json({ error: 'Nicht authentifiziert' });
                return;
            }

            // Admin kann alle User-Einträge sehen, normale User nur ihre eigenen
            if (targetUserId !== user_id && user_role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const entries = await this.timeEntryService.getUserTimeEntries(targetUserId, limit, status);
            res.json(entries);
        } catch (error) {
            console.error('Error fetching time entries:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Zeiteinträge' });
        }
    }

    // Zeitkontostand eines Users abrufen
    async getUserTimeBalance(req: Request, res: Response): Promise<void> {
        try {
            const user_id = (req as any).user?.id;
            const user_role = (req as any).user?.role;

            if (!user_id) {
                res.status(401).json({ error: 'Nicht authentifiziert' });
                return;
            }

            // Admins haben keinen eigenen Zeitkontostand
            if (user_role === 'admin') {
                res.status(403).json({ error: 'Admins haben keinen Zeitkontostand' });
                return;
            }

            const balance = await this.timeEntryService.getUserTimeBalance(user_id);
            res.json(balance);
        } catch (error) {
            console.error('Error fetching time balance:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen des Zeitkontostands' });
        }
    }

    // Zeiterfassung löschen
    async deleteTimeEntry(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user_id = (req as any).user?.id;

            if (!user_id) {
                res.status(401).json({ error: 'Nicht authentifiziert' });
                return;
            }

            const success = await this.timeEntryService.deleteTimeEntry(parseInt(id), user_id);
            
            if (success) {
                res.json({ message: 'Zeiterfassung erfolgreich gelöscht' });
            } else {
                res.status(404).json({ error: 'Zeiterfassung nicht gefunden' });
            }
        } catch (error) {
            console.error('Error deleting time entry:', error);
            res.status(500).json({ error: 'Fehler beim Löschen der Zeiterfassung' });
        }
    }

    // Admin: Zeitstatistiken aller User abrufen
    async getTimeStatistics(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const statistics = await this.timeEntryService.getTimeStatistics();
            res.json(statistics);
        } catch (error) {
            console.error('Error fetching time statistics:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
        }
    }

    // Admin: Wartende Einträge abrufen
    async getPendingTimeEntries(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const pendingEntries = await this.timeEntryService.getPendingTimeEntries();
            res.json(pendingEntries);
        } catch (error) {
            console.error('Error fetching pending entries:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der wartenden Einträge' });
        }
    }

    // Admin: Zeiteintrag genehmigen
    async approveTimeEntry(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const success = await this.timeEntryService.approveTimeEntry(parseInt(id), user.id);
            
            if (success) {
                res.json({ message: 'Zeiteintrag genehmigt' });
            } else {
                res.status(404).json({ error: 'Zeiteintrag nicht gefunden oder bereits bearbeitet' });
            }
        } catch (error) {
            console.error('Error approving time entry:', error);
            res.status(500).json({ error: 'Fehler beim Genehmigen des Zeiteintrags' });
        }
    }

    // Admin: Zeiteintrag ablehnen
    async rejectTimeEntry(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const success = await this.timeEntryService.rejectTimeEntry(parseInt(id), user.id);
            
            if (success) {
                res.json({ message: 'Zeiteintrag abgelehnt' });
            } else {
                res.status(404).json({ error: 'Zeiteintrag nicht gefunden oder bereits bearbeitet' });
            }
        } catch (error) {
            console.error('Error rejecting time entry:', error);
            res.status(500).json({ error: 'Fehler beim Ablehnen des Zeiteintrags' });
        }
    }

    // Admin: Zeiteintrag bearbeiten
    async updateTimeEntry(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { hours } = req.body;
            const user = (req as any).user;

            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            if (!hours) {
                res.status(400).json({ error: 'Stunden sind erforderlich' });
                return;
            }

            const success = await this.timeEntryService.updateTimeEntry(parseInt(id), parseFloat(hours), user.id);
            
            if (success) {
                res.json({ message: 'Zeiteintrag aktualisiert' });
            } else {
                res.status(404).json({ error: 'Zeiteintrag nicht gefunden' });
            }
        } catch (error) {
            console.error('Error updating time entry:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Zeiteintrags' });
        }
    }

    // Admin: Alte Einträge manuell bereinigen
    async cleanupOldEntries(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const deletedCount = await this.timeEntryService.cleanupOldEntries();
            res.json({ 
                message: 'Bereinigung abgeschlossen',
                deletedEntries: deletedCount 
            });
        } catch (error) {
            console.error('Error cleaning up entries:', error);
            res.status(500).json({ error: 'Fehler bei der Bereinigung' });
        }
    }

    // Admin: Zeiteintrag löschen (auch genehmigte) und Balance aktualisieren
    async adminDeleteTimeEntry(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Keine Berechtigung' });
                return;
            }

            const success = await this.timeEntryService.adminDeleteTimeEntry(parseInt(id));
            
            if (success) {
                res.json({ message: 'Zeiteintrag erfolgreich gelöscht und Balance aktualisiert' });
            } else {
                res.status(404).json({ error: 'Zeiteintrag nicht gefunden' });
            }
        } catch (error) {
            console.error('Error deleting time entry (admin):', error);
            res.status(500).json({ error: 'Fehler beim Löschen des Zeiteintrags' });
        }
    }
}