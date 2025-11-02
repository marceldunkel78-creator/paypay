"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.migrateTimeEntriesTaskId = void 0;
const index_1 = require("./index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function migrateTimeEntriesTaskId() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting time entries task_id migration...');
            const db = yield (0, index_1.connectToDatabase)();
            // Check if task_id column already exists
            const [columns] = yield db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'time_entries' 
            AND COLUMN_NAME = 'task_id'
        `);
            if (columns.length > 0) {
                console.log('Time entries task_id column already exists, skipping migration.');
                return;
            }
            // Read and execute migration SQL
            const migrationPath = path.join(__dirname, '../../migrations/005-time-entries-task-id.sql');
            const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
            // Split SQL statements and execute them
            const statements = migrationSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            for (const statement of statements) {
                yield db.execute(statement);
            }
            console.log('Time entries task_id migration completed successfully!');
        }
        catch (error) {
            console.error('Error during time entries task_id migration:', error);
            throw new Error('Time entries task_id migration failed');
        }
    });
}
exports.migrateTimeEntriesTaskId = migrateTimeEntriesTaskId;
