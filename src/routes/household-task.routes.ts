import { Router } from 'express';
import { HouseholdTaskController } from '../controllers/household-task.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export class HouseholdTaskRoutes {
    public router: Router;
    private householdTaskController: HouseholdTaskController;

    constructor() {
        this.router = Router();
        this.householdTaskController = new HouseholdTaskController();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Alle Routen benötigen Authentifizierung
        this.router.use(authMiddleware);

        // User-Routen - aktive Hausarbeiten abrufen
        this.router.get('/active', this.householdTaskController.getActiveHouseholdTasks.bind(this.householdTaskController));

        // Admin-Routen
        this.router.get('/admin/all', this.householdTaskController.getAllHouseholdTasks.bind(this.householdTaskController));
        this.router.get('/admin/:id', this.householdTaskController.getHouseholdTaskById.bind(this.householdTaskController));
        this.router.post('/admin/create', this.householdTaskController.createHouseholdTask.bind(this.householdTaskController));
        this.router.put('/admin/:id', this.householdTaskController.updateHouseholdTask.bind(this.householdTaskController));
        this.router.delete('/admin/:id', this.householdTaskController.deleteHouseholdTask.bind(this.householdTaskController));
        this.router.post('/admin/:id/deactivate', this.householdTaskController.deactivateHouseholdTask.bind(this.householdTaskController));
    }
}