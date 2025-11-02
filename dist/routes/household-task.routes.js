"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdTaskRoutes = void 0;
const express_1 = require("express");
const household_task_controller_1 = require("../controllers/household-task.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
class HouseholdTaskRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.householdTaskController = new household_task_controller_1.HouseholdTaskController();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Alle Routen benötigen Authentifizierung
        this.router.use(auth_middleware_1.authMiddleware);
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
exports.HouseholdTaskRoutes = HouseholdTaskRoutes;
