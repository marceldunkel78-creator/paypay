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
exports.migrateUserStatus = void 0;
const index_1 = require("./index");
function migrateUserStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting user status migration...');
            const db = yield (0, index_1.connectToDatabase)();
            // Check if status column already exists
            const [columns] = yield db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'status'
        `);
            if (columns.length > 0) {
                console.log('User status column already exists, skipping migration.');
                return;
            }
            // Add status column with enum values
            yield db.execute(`
            ALTER TABLE users 
            ADD COLUMN status ENUM('active', 'pending', 'suspended') DEFAULT 'pending'
        `);
            // Update existing users to 'active' status (they were already approved)
            yield db.execute(`
            UPDATE users SET status = 'active' WHERE status = 'pending'
        `);
            // Create index for better performance on status queries
            yield db.execute(`
            CREATE INDEX idx_users_status ON users(status)
        `);
            console.log('User status migration completed successfully!');
        }
        catch (error) {
            console.error('Error during user status migration:', error);
            throw error;
        }
    });
}
exports.migrateUserStatus = migrateUserStatus;
