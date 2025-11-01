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
exports.migrateTimeEntries = void 0;
const index_1 = require("./index");
function migrateTimeEntries() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting time entries migration...');
            const db = yield (0, index_1.connectToDatabase)();
            // Create time_entries table
            yield db.execute(`
            CREATE TABLE IF NOT EXISTS time_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                hours DECIMAL(5,2) NOT NULL,
                entry_type ENUM('productive', 'screen_time') NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_created (user_id, created_at)
            )
        `);
            // Create user_time_balance table
            yield db.execute(`
            CREATE TABLE IF NOT EXISTS user_time_balance (
                user_id INT PRIMARY KEY,
                current_balance DECIMAL(10,2) DEFAULT 0.00,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
            // Initialize balance for existing users
            yield db.execute(`
            INSERT IGNORE INTO user_time_balance (user_id, current_balance)
            SELECT id, 0.00 FROM users
        `);
            console.log('Time entries migration completed successfully!');
        }
        catch (error) {
            console.error('Time entries migration failed:', error);
            throw error;
        }
    });
}
exports.migrateTimeEntries = migrateTimeEntries;
