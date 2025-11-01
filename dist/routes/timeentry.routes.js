"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntryRoutes = void 0;
const express_1 = require("express");
const timeentry_controller_1 = require("../controllers/timeentry.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
class TimeEntryRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.timeEntryController = new timeentry_controller_1.TimeEntryController();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Alle Routen benötigen Authentifizierung
        this.router.use(auth_middleware_1.authMiddleware);
        // User-spezifische Routen
        this.router.post('/', this.timeEntryController.createTimeEntry.bind(this.timeEntryController));
        this.router.get('/', this.timeEntryController.getUserTimeEntries.bind(this.timeEntryController));
        this.router.get('/balance', this.timeEntryController.getUserTimeBalance.bind(this.timeEntryController));
        this.router.delete('/:id', this.timeEntryController.deleteTimeEntry.bind(this.timeEntryController));
        // Admin-Routen
        this.router.get('/admin/statistics', this.timeEntryController.getTimeStatistics.bind(this.timeEntryController));
        this.router.get('/admin/pending', this.timeEntryController.getPendingTimeEntries.bind(this.timeEntryController));
        this.router.post('/admin/approve/:id', this.timeEntryController.approveTimeEntry.bind(this.timeEntryController));
        this.router.post('/admin/reject/:id', this.timeEntryController.rejectTimeEntry.bind(this.timeEntryController));
        this.router.put('/admin/update/:id', this.timeEntryController.updateTimeEntry.bind(this.timeEntryController));
        this.router.delete('/admin/delete/:id', this.timeEntryController.adminDeleteTimeEntry.bind(this.timeEntryController));
        this.router.post('/admin/cleanup', this.timeEntryController.cleanupOldEntries.bind(this.timeEntryController));
    }
}
exports.TimeEntryRoutes = TimeEntryRoutes;
