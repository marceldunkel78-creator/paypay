import { Request, Response } from 'express';
export declare class TimeAccountController {
    private timeAccountService;
    constructor();
    createTimeAccount(req: Request, res: Response): Promise<void>;
    getTimeAccounts(req: Request, res: Response): Promise<void>;
    getTimeAccountById(req: Request, res: Response): Promise<void>;
    deleteTimeAccount(req: Request, res: Response): Promise<void>;
    getAllTimeAccounts(req: Request, res: Response): Promise<void>;
    transferHours(req: Request, res: Response): Promise<void>;
    getUserBalance(req: Request, res: Response): Promise<void>;
    getTransferHistory(req: Request, res: Response): Promise<void>;
    resetTransferHistory(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=timeaccount.controller.d.ts.map