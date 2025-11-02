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
exports.removeDefaultUsers = void 0;
const index_1 = require("./index");
function removeDefaultUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting default users cleanup...');
            const db = yield (0, index_1.connectToDatabase)();
            // Check if default users exist
            const [userRows] = yield db.execute(`
            SELECT id, username FROM users WHERE username IN ('admin1', 'admin2', 'user1')
        `);
            const defaultUsers = userRows;
            if (defaultUsers.length === 0) {
                console.log('No default test users found to remove');
                return;
            }
            // Start transaction for safe deletion
            yield db.query('START TRANSACTION');
            try {
                // First, delete all related data for these users
                for (const user of defaultUsers) {
                    console.log(`Removing data for user: ${user.username}`);
                    // Delete time_accounts entries
                    yield db.execute('DELETE FROM time_accounts WHERE user_id = ?', [user.id]);
                    // Delete time_entries entries
                    yield db.execute('DELETE FROM time_entries WHERE user_id = ?', [user.id]);
                    // Delete user_time_balance entries
                    yield db.execute('DELETE FROM user_time_balance WHERE user_id = ?', [user.id]);
                }
                // Now delete the users themselves
                const [result] = yield db.execute(`
                DELETE FROM users WHERE username IN ('admin1', 'admin2', 'user1')
            `);
                // Commit transaction
                yield db.query('COMMIT');
                const deleteResult = result;
                console.log(`Removed ${deleteResult.affectedRows} default test user(s) and all related data`);
            }
            catch (error) {
                // Rollback on error
                yield db.query('ROLLBACK');
                throw error;
            }
            console.log('Default users cleanup completed successfully!');
            console.log('To create a proper admin user, run: node scripts/create-admin.js');
        }
        catch (error) {
            // Only log as warning, don't fail the migration
            console.warn('Default users cleanup skipped:', error.message);
        }
    });
}
exports.removeDefaultUsers = removeDefaultUsers;
