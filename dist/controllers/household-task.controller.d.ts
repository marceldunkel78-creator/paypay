import { Request, Response } from 'express';
export declare class HouseholdTaskController {
    private householdTaskService;
    constructor();
    getActiveHouseholdTasks(req: Request, res: Response): Promise<void>;
    getAllHouseholdTasks(req: Request, res: Response): Promise<void>;
    getHouseholdTaskById(req: Request, res: Response): Promise<void>;
    createHouseholdTask(req: Request, res: Response): Promise<void>;
    updateHouseholdTask(req: Request, res: Response): Promise<void>;
    deleteHouseholdTask(req: Request, res: Response): Promise<void>;
    deactivateHouseholdTask(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=household-task.controller.d.ts.map