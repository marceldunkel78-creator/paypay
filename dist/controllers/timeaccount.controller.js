"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeAccountController = void 0;
const timeaccount_service_1 = require("../services/timeaccount.service");
class TimeAccountController {
    constructor() {
        this.timeAccountService = new timeaccount_service_1.TimeAccountService();
    }
    async createTimeAccount(req, res) {
        try {
            const { userId, hours } = req.body;
            const newTimeAccount = await this.timeAccountService.createTimeAccount(parseInt(userId), parseFloat(hours));
            res.status(201).json(newTimeAccount);
        }
        catch (error) {
            res.status(500).json({ message: 'Error creating time account', error });
        }
    }
    async getTimeAccounts(req, res) {
        try {
            const timeAccounts = await this.timeAccountService.getTimeAccounts();
            res.status(200).json(timeAccounts);
        }
        catch (error) {
            res.status(500).json({ message: 'Error retrieving time accounts', error });
        }
    }
    async getTimeAccountById(req, res) {
        try {
            const { id } = req.params;
            const timeAccount = await this.timeAccountService.getTimeAccountById(parseInt(id));
            if (timeAccount) {
                res.status(200).json(timeAccount);
            }
            else {
                res.status(404).json({ message: 'Time account not found' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error retrieving time account', error });
        }
    }
    async deleteTimeAccount(req, res) {
        try {
            const { id } = req.params;
            const deleted = await this.timeAccountService.deleteTimeAccount(parseInt(id));
            if (deleted) {
                res.status(200).json({ message: 'Time account deleted successfully' });
            }
            else {
                res.status(404).json({ message: 'Time account not found' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error deleting time account', error });
        }
    }
    async getAllTimeAccounts(req, res) {
        try {
            const timeAccounts = await this.timeAccountService.getTimeAccounts();
            res.status(200).json(timeAccounts);
        }
        catch (error) {
            res.status(500).json({ message: 'Error retrieving time accounts', error });
        }
    }
    // Zeit an anderen User verschenken
    async transferHours(req, res) {
        var _a;
        try {
            const { toUserId, hours, reason } = req.body;
            const fromUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // aus auth middleware
            console.log('Transfer request:', { fromUserId, toUserId, hours, reason });
            if (!fromUserId) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            if (!toUserId || !hours) {
                res.status(400).json({ message: 'Recipient user ID and hours are required' });
                return;
            }
            const success = await this.timeAccountService.transferHoursToUser(parseInt(fromUserId), parseInt(toUserId), parseFloat(hours), reason);
            if (success) {
                res.status(200).json({
                    message: 'Hours transferred successfully',
                    transfer: {
                        fromUserId: parseInt(fromUserId),
                        toUserId: parseInt(toUserId),
                        hours: parseFloat(hours),
                        reason: reason || 'Zeitübertragung'
                    }
                });
            }
            else {
                res.status(400).json({ message: 'Failed to transfer hours' });
            }
        }
        catch (error) {
            console.error('Transfer error:', error);
            res.status(400).json({
                message: error instanceof Error ? error.message : 'Error transferring hours'
            });
        }
    }
    // Aktuelle Balance abrufen
    async getUserBalance(req, res) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // aus auth middleware
            console.log('Getting balance for user ID:', userId);
            if (!userId) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            const balance = await this.timeAccountService.getUserBalance(parseInt(userId));
            console.log('Retrieved balance:', balance);
            res.status(200).json({ balance });
        }
        catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({ message: 'Error retrieving balance' });
        }
    }
    // Transfer-Historie abrufen
    async getTransferHistory(req, res) {
        try {
            const userId = req.user.id; // aus auth middleware
            const transfers = await this.timeAccountService.getTransferHistory(parseInt(userId));
            res.status(200).json(transfers);
        }
        catch (error) {
            console.error('Get transfer history error:', error);
            res.status(500).json({ message: 'Error retrieving transfer history' });
        }
    }
    // Transfer-Historie zurücksetzen
    async resetTransferHistory(req, res) {
        try {
            const userId = req.user.id; // aus auth middleware
            await this.timeAccountService.resetTransferHistory(parseInt(userId));
            res.status(200).json({ message: 'Transfer-Historie erfolgreich zurückgesetzt' });
        }
        catch (error) {
            console.error('Reset transfer history error:', error);
            res.status(500).json({ message: 'Error resetting transfer history' });
        }
    }
}
exports.TimeAccountController = TimeAccountController;
//# sourceMappingURL=timeaccount.controller.js.map