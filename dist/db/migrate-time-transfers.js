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
exports.migrateTimeTransfers = void 0;
const index_1 = require("./index");
function migrateTimeTransfers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting time transfers migration...');
            const connection = yield (0, index_1.connectToDatabase)();
            // Check if time_transfers table exists
            const [tables] = yield connection.execute(`
            SHOW TABLES LIKE 'time_transfers'
        `);
            if (tables.length > 0) {
                console.log('Time transfers table already exists, skipping migration.');
                return;
            }
            // Create time_transfers table
            const createTableSQL = `
            CREATE TABLE time_transfers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                from_user_id INT NOT NULL,
                to_user_id INT NOT NULL,
                hours DECIMAL(10, 2) NOT NULL,
                reason VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                INDEX idx_from_user (from_user_id),
                INDEX idx_to_user (to_user_id),
                INDEX idx_created_at (created_at)
            )
        `;
            yield connection.execute(createTableSQL);
            console.log('Time transfers migration completed successfully!');
        }
        catch (error) {
            console.error('Error in time transfers migration:', error);
            throw error;
        }
    });
}
exports.migrateTimeTransfers = migrateTimeTransfers;
