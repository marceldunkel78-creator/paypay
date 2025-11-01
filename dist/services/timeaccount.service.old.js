"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeAccountService = void 0;
class TimeAccountService {
    constructor() {
        this.timeAccounts = [];
        // Initialize with some dummy data or fetch from the database
    }
    createTimeAccount(userId, hours) {
        const newAccount = { userId, hours, createdAt: new Date() };
        this.timeAccounts.push(newAccount);
        return newAccount;
    }
    updateTimeAccount(accountId, hours) {
        const account = this.timeAccounts.find(acc => acc.id === accountId);
        if (account) {
            account.hours = hours;
            return account;
        }
        return null;
    }
    getTimeAccountsByUser(userId) {
        return this.timeAccounts.filter(acc => acc.userId === userId);
    }
    approveRequest(accountId) {
        const account = this.timeAccounts.find(acc => acc.id === accountId);
        if (account) {
            // Logic to approve the request (e.g., send email notification)
            return true;
        }
        return false;
    }
    rejectRequest(accountId) {
        const index = this.timeAccounts.findIndex(acc => acc.id === accountId);
        if (index !== -1) {
            this.timeAccounts.splice(index, 1);
            return true;
        }
        return false;
    }
}
exports.TimeAccountService = TimeAccountService;
