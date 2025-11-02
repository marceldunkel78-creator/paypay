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
exports.TimeEntryController = void 0;
const timeentry_service_1 = require("../services/timeentry.service");
class TimeEntryController {
    constructor() {
        this.timeEntryService = new timeentry_service_1.TimeEntryService();
    }
    // Neue Zeiterfassung erstellen (Status: pending)
    createTimeEntry(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { task_id, entry_type, description, hours } = req.body;
                const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const user_role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
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
                const timeEntry = {
                    user_id,
                    task_id: task_id ? parseInt(task_id) : undefined,
                    hours: hours || 0,
                    entry_type,
                    description: description || '',
                    status: 'pending'
                };
                const createdEntry = yield this.timeEntryService.createTimeEntry(timeEntry);
                res.status(201).json({
                    message: 'Zeiterfassung erstellt und wartet auf Genehmigung',
                    timeEntry: createdEntry
                });
            }
            catch (error) {
                console.error('Error creating time entry:', error);
                res.status(500).json({ error: 'Fehler beim Erstellen der Zeiterfassung' });
            }
        });
    }
    // Zeiteinträge eines Users abrufen
    getUserTimeEntries(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const user_role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                const limit = parseInt(req.query.limit) || 50;
                const status = req.query.status;
                const targetUserId = req.query.userId ? parseInt(req.query.userId) : user_id;
                if (!user_id) {
                    res.status(401).json({ error: 'Nicht authentifiziert' });
                    return;
                }
                // Admin kann alle User-Einträge sehen, normale User nur ihre eigenen
                if (targetUserId !== user_id && user_role !== 'admin') {
                    res.status(403).json({ error: 'Keine Berechtigung' });
                    return;
                }
                const entries = yield this.timeEntryService.getUserTimeEntries(targetUserId, limit, status);
                res.json(entries);
            }
            catch (error) {
                console.error('Error fetching time entries:', error);
                res.status(500).json({ error: 'Fehler beim Abrufen der Zeiteinträge' });
            }
        });
    }
    // Zeitkontostand eines Users abrufen
    getUserTimeBalance(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const user_role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                if (!user_id) {
                    res.status(401).json({ error: 'Nicht authentifiziert' });
                    return;
                }
                // Admins haben keinen eigenen Zeitkontostand
                if (user_role === 'admin') {
                    res.status(403).json({ error: 'Admins haben keinen Zeitkontostand' });
                    return;
                }
                const balance = yield this.timeEntryService.getUserTimeBalance(user_id);
                res.json(balance);
            }
            catch (error) {
                console.error('Error fetching time balance:', error);
                res.status(500).json({ error: 'Fehler beim Abrufen des Zeitkontostands' });
            }
        });
    }
    // Zeiterfassung löschen
    deleteTimeEntry(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!user_id) {
                    res.status(401).json({ error: 'Nicht authentifiziert' });
                    return;
                }
                const success = yield this.timeEntryService.deleteTimeEntry(parseInt(id), user_id);
                if (success) {
                    res.json({ message: 'Zeiterfassung erfolgreich gelöscht' });
                }
                else {
                    res.status(404).json({ error: 'Zeiterfassung nicht gefunden' });
                }
            }
            catch (error) {
                console.error('Error deleting time entry:', error);
                res.status(500).json({ error: 'Fehler beim Löschen der Zeiterfassung' });
            }
        });
    }
    // Admin: Zeitstatistiken aller User abrufen
    getTimeStatistics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                if (!user || user.role !== 'admin') {
                    res.status(403).json({ error: 'Keine Berechtigung' });
                    return;
                }
                const statistics = yield this.timeEntryService.getTimeStatistics();
                res.json(statistics);
            }
            catch (error) {
                console.error('Error fetching time statistics:', error);
                res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
            }
        });
    }
    // Admin: Wartende Einträge abrufen
    getPendingTimeEntries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                if (!user || user.role !== 'admin') {
                    res.status(403).json({ error: 'Keine Berechtigung' });
                    return;
                }
                const pendingEntries = yield this.timeEntryService.getPendingTimeEntries();
                res.json(pendingEntries);
            }
            catch (error) {
                console.error('Error fetching pending entries:', error);
                res.status(500).json({ error: 'Fehler beim Abrufen der wartenden Einträge' });
            }
        });
    }
    // Admin: Zeiteintrag genehmigen
    approveTimeEntry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                if (!user || user.role !== 'admin') {
                    res.status(403).json({ error: 'Keine Berechtigung' });
                    return;
                }
                const success = yield this.timeEntryService.approveTimeEntry(parseInt(id), user.id);
                if (success) {
                    res.json({ message: 'Zeiteintrag genehmigt' });
                }
                else {
                    res.status(404).json({ error: 'Zeiteintrag nicht gefunden oder bereits bearbeitet' });
                }
            }
            catch (error) {
                console.error('Error approving time entry:', error);
                res.status(500).json({ error: 'Fehler beim Genehmigen des Zeiteintrags' });
            }
        });
    }
    // Admin: Zeiteintrag ablehnen
    rejectTimeEntry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                if (!user || user.role !== 'admin') {
                    res.status(403).json({ error: 'Keine Berechtigung' });
                    return;
                }
                const success = yield this.timeEntryService.rejectTimeEntry(parseInt(id), user.id);
                if (success) {
                    res.json({ message: 'Zeiteintrag abgelehnt' });
                }
                else {
                    res.status(404).json({ error: 'Zeiteintrag nicht gefunden oder bereits bearbeitet' });
                }
            }
            catch (error) {
                console.error('Error rejecting time entry:', error);
                res.status(500).json({ error: 'Fehler beim Ablehnen des Zeiteintrags' });
            }
        });
    }
    // Admin: Zeiteintrag bearbeiten
    updateTimeEntry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { hours } = req.body;
                const user = req.user;
                if (!user || user.role !== 'admin') {
                    res.status(403).json({ error: 'Keine Berechtigung' });
                    return;
                }
                if (!hours) {
                    res.status(400).json({ error: 'Stunden sind erforderlich' });
                    return;
                }
                const success = yield this.timeEntryService.updateTimeEntry(parseInt(id), parseFloat(hours), user.id);
                if (success) {
                    res.json({ message: 'Zeiteintrag aktualisiert' });
                }
                else {
                    res.status(404).json({ error: 'Zeiteintrag nicht gefunden' });
                }
            }
            catch (error) {
                console.error('Error updating time entry:', error);
                res.status(500).json({ error: 'Fehler beim Aktualisieren des Zeiteintrags' });
            }
        });
    }
    // Admin: Alte Einträge manuell bereinigen
    cleanupOldEntries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                if (!user || user.role !== 'admin') {
                    res.status(403).json({ error: 'Keine Berechtigung' });
                    return;
                }
                const deletedCount = yield this.timeEntryService.cleanupOldEntries();
                res.json({
                    message: 'Bereinigung abgeschlossen',
                    deletedEntries: deletedCount
                });
            }
            catch (error) {
                console.error('Error cleaning up entries:', error);
                res.status(500).json({ error: 'Fehler bei der Bereinigung' });
            }
        });
    }
    // Admin: Zeiteintrag löschen (auch genehmigte) und Balance aktualisieren
    adminDeleteTimeEntry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                if (!user || user.role !== 'admin') {
                    res.status(403).json({ error: 'Keine Berechtigung' });
                    return;
                }
                const success = yield this.timeEntryService.adminDeleteTimeEntry(parseInt(id));
                if (success) {
                    res.json({ message: 'Zeiteintrag erfolgreich gelöscht und Balance aktualisiert' });
                }
                else {
                    res.status(404).json({ error: 'Zeiteintrag nicht gefunden' });
                }
            }
            catch (error) {
                console.error('Error deleting time entry (admin):', error);
                res.status(500).json({ error: 'Fehler beim Löschen des Zeiteintrags' });
            }
        });
    }
}
exports.TimeEntryController = TimeEntryController;
