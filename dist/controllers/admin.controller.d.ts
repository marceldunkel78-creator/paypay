import { Request, Response } from 'express';
export declare class AdminController {
    private timeAccountService;
    private emailService;
    private authService;
    private householdTaskService;
    constructor();
    approveRequest(req: Request, res: Response): Promise<void>;
    rejectRequest(req: Request, res: Response): Promise<void>;
    getPendingRequests(req: Request, res: Response): Promise<void>;
    getAllUsers(req: Request, res: Response): Promise<void>;
    getPendingUsers(req: Request, res: Response): Promise<void>;
    approveUser(req: Request, res: Response): Promise<void>;
    suspendUser(req: Request, res: Response): Promise<void>;
    activateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
    getHouseholdTasks(req: Request, res: Response): Promise<void>;
    updateWeightFactor(req: Request, res: Response): Promise<void>;
    adjustUserBalance(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=admin.controller.d.ts.map