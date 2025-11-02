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
exports.migrateHouseholdTasks = void 0;
const index_1 = require("./index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function migrateHouseholdTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting household tasks migration...');
            const db = yield (0, index_1.connectToDatabase)();
            // Check if household_tasks table exists
            const [tables] = yield db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'household_tasks'
        `);
            if (tables.length > 0) {
                console.log('Household tasks table already exists, skipping migration.');
                return;
            }
            // Read and execute migration SQL
            const migrationPath = path.join(__dirname, '../../migrations/004-household-tasks.sql');
            const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
            // Execute migration step by step
            // 1. Create table
            yield db.execute(`
            CREATE TABLE IF NOT EXISTS household_tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                hours DECIMAL(4,2) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
            // 2. Insert example data
            yield db.execute(`
            INSERT IGNORE INTO household_tasks (name, hours, is_active) VALUES
            ('Küche aufräumen', 0.5, TRUE),
            ('Staubsaugen (ganze Wohnung)', 1.0, TRUE),
            ('Badezimmer putzen', 0.75, TRUE),
            ('Wäsche waschen und aufhängen', 0.5, TRUE),
            ('Geschirrspüler ausräumen', 0.25, TRUE),
            ('Müll rausbringen', 0.25, TRUE),
            ('Boden wischen', 1.0, TRUE),
            ('Fenster putzen', 1.5, TRUE),
            ('Betten beziehen', 0.5, TRUE),
            ('Wäsche zusammenlegen', 0.5, TRUE),
            ('Kühlschrank reinigen', 1.0, TRUE),
            ('Gartenarbeit (1 Stunde)', 1.0, TRUE),
            ('Auto waschen', 1.5, TRUE),
            ('Keller aufräumen', 2.0, TRUE),
            ('Einkaufen erledigen', 1.0, TRUE)
        `);
            // 3. Create indexes (if they don't exist)
            try {
                yield db.execute(`CREATE INDEX idx_household_tasks_active ON household_tasks(is_active)`);
            }
            catch (error) {
                if (error.code !== 'ER_DUP_KEYNAME') {
                    throw error;
                }
            }
            try {
                yield db.execute(`CREATE INDEX idx_household_tasks_name ON household_tasks(name)`);
            }
            catch (error) {
                if (error.code !== 'ER_DUP_KEYNAME') {
                    throw error;
                }
            }
            console.log('Household tasks migration completed successfully!');
        }
        catch (error) {
            console.error('Error during household tasks migration:', error);
            throw new Error('Household tasks migration failed');
        }
    });
}
exports.migrateHouseholdTasks = migrateHouseholdTasks;
