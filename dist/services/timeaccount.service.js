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
    // Admin: User Balance Management
    adjustUserBalance(userId, newBalance) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                // Prüfen ob Benutzer existiert
                const [userRows] = yield connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
                const users = userRows;
                if (users.length === 0) {
                    return false; // User not found
                }
                // Balance aktualisieren oder einfügen (UPSERT)
                yield connection.execute(`
                INSERT INTO user_time_balance (user_id, current_balance, last_updated)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    current_balance = ?,
                    last_updated = CURRENT_TIMESTAMP
            `, [userId, newBalance, newBalance]);
                console.log(`Admin adjusted balance for user ${userId} to ${newBalance} hours`);
                return true;
            }
            catch (error) {
                console.error('Error adjusting user balance:', error);
                throw new Error('Failed to adjust user balance');
            }
        });
    }
    // User: Zeit an anderen User verschenken
    transferHoursToUser(fromUserId, toUserId, hours, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                // Validierung: Beide User müssen existieren
                const [fromUserRows] = yield connection.execute('SELECT id, username FROM users WHERE id = ?', [fromUserId]);
                const [toUserRows] = yield connection.execute('SELECT id, username FROM users WHERE id = ?', [toUserId]);
                const fromUsers = fromUserRows;
                const toUsers = toUserRows;
                if (fromUsers.length === 0) {
                    throw new Error('Sender user not found');
                }
                if (toUsers.length === 0) {
                    throw new Error('Recipient user not found');
                }
                if (fromUserId === toUserId) {
                    throw new Error('Cannot transfer hours to yourself');
                }
                if (hours <= 0) {
                    throw new Error('Hours must be positive');
                }
                // Prüfen ob Sender genügend Guthaben hat
                const [balanceRows] = yield connection.execute('SELECT current_balance FROM user_time_balance WHERE user_id = ?', [fromUserId]);
                const balances = balanceRows;
                const currentBalance = balances.length > 0 ? balances[0].current_balance : 0;
                if (currentBalance < hours) {
                    throw new Error(`Insufficient balance. Current balance: ${currentBalance} hours, requested: ${hours} hours`);
                }
                // Transaction für atomare Übertragung
                yield connection.query('START TRANSACTION');
                try {
                    // Stunden vom Sender abziehen
                    yield connection.execute(`
                    INSERT INTO user_time_balance (user_id, current_balance, last_updated)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON DUPLICATE KEY UPDATE
                        current_balance = current_balance - ?,
                        last_updated = CURRENT_TIMESTAMP
                `, [fromUserId, -hours, hours]);
                    // Stunden zum Empfänger hinzufügen
                    yield connection.execute(`
                    INSERT INTO user_time_balance (user_id, current_balance, last_updated)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON DUPLICATE KEY UPDATE
                        current_balance = current_balance + ?,
                        last_updated = CURRENT_TIMESTAMP
                `, [toUserId, hours, hours]);
                    // Transfer-Log erstellen
                    yield connection.execute(`
                    INSERT INTO time_transfers (from_user_id, to_user_id, hours, reason, created_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [fromUserId, toUserId, hours, reason || 'Zeitübertragung']);
                    yield connection.query('COMMIT');
                    console.log(`User ${fromUsers[0].username} transferred ${hours} hours to ${toUsers[0].username}`);
                    return true;
                }
                catch (transactionError) {
                    yield connection.query('ROLLBACK');
                    throw transactionError;
                }
            }
            catch (error) {
                console.error('Error transferring hours:', error);
                throw error;
            }
        });
    }
    // Aktuelle Balance eines Users abrufen
    getUserBalance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                // Versuche zuerst aus der user_time_balance Tabelle zu laden
                const [balanceRows] = yield connection.execute('SELECT current_balance FROM user_time_balance WHERE user_id = ?', [userId]);
                const balances = balanceRows;
                if (balances.length > 0) {
                    return parseFloat(balances[0].current_balance);
                }
                // Falls kein Eintrag existiert, berechne aus time_entries
                const [entryRows] = yield connection.execute(`
                SELECT SUM(hours) as total_hours 
                FROM time_entries 
                WHERE user_id = ?
            `, [userId]);
                const entries = entryRows;
                const calculatedBalance = entries.length > 0 ? parseFloat(entries[0].total_hours || '0') : 0;
                // Erstelle Eintrag in user_time_balance für zukünftige Abfragen
                if (calculatedBalance !== 0) {
                    yield connection.execute(`
                    INSERT INTO user_time_balance (user_id, current_balance, last_updated)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                `, [userId, calculatedBalance]);
                }
                return calculatedBalance;
            }
            catch (error) {
                console.error('Error getting user balance:', error);
                return 0;
            }
        });
    }
    // Transfer-Historie für einen User abrufen (als Sender oder Empfänger)
    getTransferHistory(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                const [rows] = yield connection.execute(`
                SELECT 
                    tt.*,
                    fu.username as from_username,
                    tu.username as to_username
                FROM time_transfers tt
                JOIN users fu ON tt.from_user_id = fu.id
                JOIN users tu ON tt.to_user_id = tu.id
                WHERE tt.from_user_id = ? OR tt.to_user_id = ?
                ORDER BY tt.created_at DESC
                LIMIT 50
            `, [userId, userId]);
                const transfers = rows;
                return transfers.map(transfer => ({
                    id: transfer.id,
                    fromUserId: transfer.from_user_id,
                    fromUsername: transfer.from_username,
                    toUserId: transfer.to_user_id,
                    toUsername: transfer.to_username,
                    hours: parseFloat(transfer.hours),
                    reason: transfer.reason,
                    createdAt: transfer.created_at,
                    type: transfer.from_user_id === userId ? 'sent' : 'received'
                }));
            }
            catch (error) {
                console.error('Error getting transfer history:', error);
                return [];
            }
        });
    }
}
exports.TimeAccountService = TimeAccountService;
