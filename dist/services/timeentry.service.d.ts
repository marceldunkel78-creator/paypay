import { TimeEntry, UserTimeBalance } from '../models/timeentry.model';
export declare class TimeEntryService {
    private householdTaskService;
    constructor();
    createTimeEntry(timeEntry: Omit<TimeEntry, 'id' | 'created_at'>): Promise<TimeEntry & {
        task_name?: string;
    }>;
    getUserTimeEntries(userId: number, limit?: number, status?: string): Promise<TimeEntry[]>;
    getUserTimeBalance(userId: number): Promise<UserTimeBalance | null>;
    private initializeUserBalance;
    deleteTimeEntry(entryId: number, userId: number): Promise<boolean>;
    private updateUserBalance;
    cleanupOldEntries(): Promise<number>;
    adminCleanupOldEntries(): Promise<number>;
    getTimeStatistics(): Promise<any>;
    approveTimeEntry(entryId: number, adminUserId: number): Promise<{
        success: boolean;
        userEmail?: string;
    }>;
    rejectTimeEntry(entryId: number, adminUserId: number): Promise<boolean>;
    updateTimeEntry(entryId: number, hours: number, adminUserId: number): Promise<boolean>;
    updateTimeEntryByMinutes(entryId: number, inputMinutes: number, adminUserId: number): Promise<boolean>;
    getPendingTimeEntries(): Promise<TimeEntry[]>;
    adminDeleteTimeEntry(entryId: number): Promise<boolean>;
    getUserById(userId: number): Promise<{
        username: string;
        email: string;
    } | null>;
}
//# sourceMappingURL=timeentry.service.d.ts.map