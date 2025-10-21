import { TimeAccount } from '../models/timeaccount.model';
import { User } from '../models/user.model';

export class TimeAccountService {
    private timeAccounts: TimeAccount[] = [];

    constructor() {
        // Initialize with some dummy data or fetch from the database
    }

    public createTimeAccount(userId: string, hours: number): TimeAccount {
        const newAccount: TimeAccount = { userId, hours, createdAt: new Date() };
        this.timeAccounts.push(newAccount);
        return newAccount;
    }

    public updateTimeAccount(accountId: string, hours: number): TimeAccount | null {
        const account = this.timeAccounts.find(acc => acc.id === accountId);
        if (account) {
            account.hours = hours;
            return account;
        }
        return null;
    }

    public getTimeAccountsByUser(userId: string): TimeAccount[] {
        return this.timeAccounts.filter(acc => acc.userId === userId);
    }

    public approveRequest(accountId: string): boolean {
        const account = this.timeAccounts.find(acc => acc.id === accountId);
        if (account) {
            // Logic to approve the request (e.g., send email notification)
            return true;
        }
        return false;
    }

    public rejectRequest(accountId: string): boolean {
        const index = this.timeAccounts.findIndex(acc => acc.id === accountId);
        if (index !== -1) {
            this.timeAccounts.splice(index, 1);
            return true;
        }
        return false;
    }
}