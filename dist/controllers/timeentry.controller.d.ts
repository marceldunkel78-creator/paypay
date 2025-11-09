import { Request, Response } from 'express';
export declare class TimeEntryController {
    private timeEntryService;
    private emailService;
    constructor();
    createTimeEntry(req: Request, res: Response): Promise<void>;
    getUserTimeEntries(req: Request, res: Response): Promise<void>;
    getUserTimeBalance(req: Request, res: Response): Promise<void>;
    deleteTimeEntry(req: Request, res: Response): Promise<void>;
    getTimeStatistics(req: Request, res: Response): Promise<void>;
    getPendingTimeEntries(req: Request, res: Response): Promise<void>;
    approveTimeEntry(req: Request, res: Response): Promise<void>;
    rejectTimeEntry(req: Request, res: Response): Promise<void>;
    updateTimeEntry(req: Request, res: Response): Promise<void>;
    cleanupOldEntries(req: Request, res: Response): Promise<void>;
    adminDeleteTimeEntry(req: Request, res: Response): Promise<void>;
    private sendAdminNotification;
}
//# sourceMappingURL=timeentry.controller.d.ts.map