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
exports.TimeAccountService = void 0;
const index_1 = require("../db/index");
class TimeAccountService {
    createTimeAccount(userId, hours) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [result] = yield connection.execute('INSERT INTO time_accounts (user_id, hours) VALUES (?, ?)', [userId, hours]);
            const insertResult = result;
            return {
                id: insertResult.insertId,
                user_id: userId,
                hours: hours,
                status: 'pending'
            };
        });
    }
    getTimeAccountsByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [rows] = yield connection.execute('SELECT * FROM time_accounts WHERE user_id = ?', [userId]);
            return rows;
        });
    }
    getTimeAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [rows] = yield connection.execute('SELECT * FROM time_accounts');
            return rows;
        });
    }
    getTimeAccountById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [rows] = yield connection.execute('SELECT * FROM time_accounts WHERE id = ?', [id]);
            const accounts = rows;
            return accounts[0] || null;
        });
    }
    getRequestById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [rows] = yield connection.execute('SELECT ta.*, u.username as userEmail FROM time_accounts ta JOIN users u ON ta.user_id = u.id WHERE ta.id = ?', [id]);
            const results = rows;
            return results[0] || null;
        });
    }
    updateTimeAccountStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            yield connection.execute('UPDATE time_accounts SET status = ? WHERE id = ?', [status, id]);
        });
    }
    deleteTimeAccount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [result] = yield connection.execute('DELETE FROM time_accounts WHERE id = ?', [id]);
            const deleteResult = result;
            return deleteResult.affectedRows > 0;
        });
    }
    approveRequest(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateTimeAccountStatus(accountId, 'approved');
            return true;
        });
    }
    rejectRequest(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateTimeAccountStatus(accountId, 'rejected');
            return true;
        });
    }
}
exports.TimeAccountService = TimeAccountService;
