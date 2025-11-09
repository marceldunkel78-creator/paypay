"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeAccountController = void 0;
const timeaccount_service_1 = require("../services/timeaccount.service");
class TimeAccountController {
    constructor() {
        this.timeAccountService = new timeaccount_service_1.TimeAccountService();
    }
    createTimeAccount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, hours } = req.body;
                const newTimeAccount = yield this.timeAccountService.createTimeAccount(parseInt(userId), parseFloat(hours));
                res.status(201).json(newTimeAccount);
            }
            catch (error) {
                res.status(500).json({ message: 'Error creating time account', error });
            }
        });
    }
    getTimeAccounts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const timeAccounts = yield this.timeAccountService.getTimeAccounts();
                res.status(200).json(timeAccounts);
            }
            catch (error) {
                res.status(500).json({ message: 'Error retrieving time accounts', error });
            }
        });
    }
    getTimeAccountById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const timeAccount = yield this.timeAccountService.getTimeAccountById(parseInt(id));
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
        });
    }
    deleteTimeAccount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const deleted = yield this.timeAccountService.deleteTimeAccount(parseInt(id));
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
        });
    }
    getAllTimeAccounts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const timeAccounts = yield this.timeAccountService.getTimeAccounts();
                res.status(200).json(timeAccounts);
            }
            catch (error) {
                res.status(500).json({ message: 'Error retrieving time accounts', error });
            }
        });
    }
    // Zeit an anderen User verschenken
    transferHours(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
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
                const success = yield this.timeAccountService.transferHoursToUser(parseInt(fromUserId), parseInt(toUserId), parseFloat(hours), reason);
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
        });
    }
    // Aktuelle Balance abrufen
    getUserBalance(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // aus auth middleware
                console.log('Getting balance for user ID:', userId);
                if (!userId) {
                    res.status(401).json({ message: 'User not authenticated' });
                    return;
                }
                const balance = yield this.timeAccountService.getUserBalance(parseInt(userId));
                console.log('Retrieved balance:', balance);
                res.status(200).json({ balance });
            }
            catch (error) {
                console.error('Get balance error:', error);
                res.status(500).json({ message: 'Error retrieving balance' });
            }
        });
    }
    // Transfer-Historie abrufen
    getTransferHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id; // aus auth middleware
                const transfers = yield this.timeAccountService.getTransferHistory(parseInt(userId));
                res.status(200).json(transfers);
            }
            catch (error) {
                console.error('Get transfer history error:', error);
                res.status(500).json({ message: 'Error retrieving transfer history' });
            }
        });
    }
}
exports.TimeAccountController = TimeAccountController;
