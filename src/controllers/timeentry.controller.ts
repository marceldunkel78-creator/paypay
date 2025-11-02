import { Request, Response } from 'express';
import { TimeEntryService } from '../services/timeentry.service';
import { TimeEntry } from '../models/timeentry.model';
import { EmailService } from '../services/email.service';

export class TimeEntryController {
    private timeEntryService: TimeEntryService;
    private emailService: EmailService;

    constructor() {
        this.timeEntryService = new TimeEntryService();
        this.emailService = new EmailService();
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
            
            // Send notification to admins about new time entry (async, don't wait)
            this.sendAdminNotification(createdEntry).catch(error => 
                console.warn('Failed to send admin notification:', error)
            );
            
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

            const result = await this.timeEntryService.approveTimeEntry(parseInt(id), user.id);
            
            if (result.success) {
                // Send email notification if email is configured and user email available
                if (result.userEmail && result.userEmail.includes('@')) {
                    try {
                        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                            await this.emailService.sendApprovalConfirmation(
                                result.userEmail,
                                'Zeiteintrag genehmigt',
                                '<h1>✅ Zeiteintrag genehmigt!</h1><p>Ihr Zeiteintrag wurde von einem Administrator genehmigt.</p>'
                            );
                            console.log(`Approval notification sent to ${result.userEmail}`);
                        } else {
                            console.log('Email not configured - skipping notification');
                        }
                    } catch (emailError) {
                        console.warn('Failed to send email notification:', emailError);
                        // Continue without failing the request
                    }
                } else {
                    console.log(`No valid email found for user: ${result.userEmail}`);
                }
                
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
            console.error('Error deleting time entry:', error);
            res.status(500).json({ error: 'Fehler beim Löschen des Zeiteintrags' });
        }
    }

    // Send notification to all admins about new time entry
    private async sendAdminNotification(timeEntry: TimeEntry & { task_name?: string }): Promise<void> {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                console.log('Email not configured - skipping admin notification');
                return;
            }

            // Get admin emails from environment variables
            const adminEmails = [
                process.env.ADMIN_EMAIL_1,
                process.env.ADMIN_EMAIL_2
            ].filter(email => email && email.includes('@'));

            if (adminEmails.length === 0) {
                console.log('No valid admin emails configured');
                return;
            }

            // Get user details for the notification
            const userDetails = await this.timeEntryService.getUserById(timeEntry.user_id);
            const userName = userDetails?.username || 'Unbekannter Benutzer';
            const userEmail = userDetails?.email || 'Keine E-Mail';

            // Build task information for productive time
            let taskInfo = '';
            if (timeEntry.entry_type === 'productive' && timeEntry.task_name) {
                taskInfo = `<p><strong>Hausarbeit:</strong> ${timeEntry.task_name}</p>`;
            }

            const subject = `Neue Zeiterfassung zur Genehmigung - ${userName}`;
            const html = `
                <h2>🕒 Neue Zeiterfassung wartet auf Genehmigung</h2>
                <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <p><strong>Benutzer:</strong> ${userName} (${userEmail})</p>
                    <p><strong>Stunden:</strong> ${timeEntry.hours} Stunden</p>
                    <p><strong>Typ:</strong> ${timeEntry.entry_type === 'productive' ? 'Produktive Zeit' : 'Bildschirmzeit'}</p>
                    ${taskInfo}
                    <p><strong>Beschreibung:</strong> ${timeEntry.description || 'Keine Beschreibung'}</p>
                    <p><strong>Erstellt am:</strong> ${new Date().toLocaleString('de-DE')}</p>
                </div>
                <p>Bitte loggen Sie sich in die Time Account Management App ein, um diese Anfrage zu genehmigen oder abzulehnen.</p>
                <p><em>Diese E-Mail wurde automatisch generiert.</em></p>
            `;

            // Send to all admin emails
            for (const adminEmail of adminEmails) {
                if (adminEmail) { // Type guard to ensure adminEmail is not undefined
                    try {
                        await this.emailService.sendApprovalRequest(adminEmail, subject, html);
                        console.log(`Admin notification sent to ${adminEmail}`);
                    } catch (emailError) {
                        console.warn(`Failed to send notification to ${adminEmail}:`, emailError);
                    }
                }
            }
        } catch (error) {
            console.error('Error sending admin notification:', error);
        }
    }
}