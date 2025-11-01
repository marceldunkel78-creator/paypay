import { Router } from 'express';
import { TimeEntryController } from '../controllers/timeentry.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export class TimeEntryRoutes {
    public router: Router;
    private timeEntryController: TimeEntryController;

    constructor() {
        this.router = Router();
        this.timeEntryController = new TimeEntryController();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Alle Routen benötigen Authentifizierung
        this.router.use(authMiddleware);

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