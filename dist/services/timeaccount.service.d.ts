import { TimeAccount } from '../models/timeaccount.model';
export declare class TimeAccountService {
    createTimeAccount(userId: number, hours: number): Promise<TimeAccount>;
    getTimeAccountsByUser(userId: number): Promise<TimeAccount[]>;
    getTimeAccounts(): Promise<TimeAccount[]>;
    getTimeAccountById(id: number): Promise<TimeAccount | null>;
    getRequestById(id: number): Promise<any>;
    updateTimeAccountStatus(id: number, status: 'approved' | 'rejected'): Promise<void>;
    deleteTimeAccount(id: number): Promise<boolean>;
    approveRequest(accountId: number): Promise<boolean>;
    rejectRequest(accountId: number): Promise<boolean>;
    adjustUserBalance(userId: number, newBalance: number): Promise<boolean>;
    transferHoursToUser(fromUserId: number, toUserId: number, hours: number, reason?: string): Promise<boolean>;
    getUserBalance(userId: number): Promise<number>;
    getTransferHistory(userId: number): Promise<any[]>;
    resetTransferHistory(userId: number): Promise<void>;
}
//# sourceMappingURL=timeaccount.service.d.ts.map