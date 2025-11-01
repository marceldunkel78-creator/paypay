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
exports.migrateApprovalSystem = void 0;
const index_1 = require("./index");
function migrateApprovalSystem() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting approval system migration...');
            const db = yield (0, index_1.connectToDatabase)();
            // Check if columns already exist
            const [columns] = yield db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'time_account_db' 
            AND TABLE_NAME = 'time_entries' 
            AND COLUMN_NAME IN ('status', 'approved_at', 'approved_by')
        `);
            if (columns.length === 0) {
                // Add approval system columns
                yield db.execute(`
                ALTER TABLE time_entries 
                ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                ADD COLUMN approved_at TIMESTAMP NULL,
                ADD COLUMN approved_by INT NULL
            `);
                // Add foreign key constraint
                yield db.execute(`
                ALTER TABLE time_entries 
                ADD FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
            `);
                // Add indexes for better performance
                yield db.execute(`
                ALTER TABLE time_entries 
                ADD INDEX idx_status (status),
                ADD INDEX idx_user_status (user_id, status)
            `);
                console.log('Approval system migration completed successfully!');
            }
            else {
                console.log('Approval system already exists, skipping migration.');
            }
        }
        catch (error) {
            console.error('Approval system migration failed:', error);
            throw error;
        }
    });
}
exports.migrateApprovalSystem = migrateApprovalSystem;
