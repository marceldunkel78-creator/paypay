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
exports.migrateWeightFactors = void 0;
function migrateWeightFactors(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting weight factors migration...');
        try {
            // Check if weight_factor column already exists
            const [columns] = yield connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'household_tasks' 
            AND COLUMN_NAME = 'weight_factor'
        `);
            if (Array.isArray(columns) && columns.length > 0) {
                console.log('Weight factors already exist, skipping migration.');
                return;
            }
            // Add weight_factor column to household_tasks
            yield connection.execute(`
            ALTER TABLE household_tasks 
            ADD COLUMN weight_factor DECIMAL(3,2) DEFAULT 1.00 AFTER hours,
            ADD COLUMN description TEXT NULL AFTER weight_factor
        `);
            // Add input tracking columns to time_entries  
            yield connection.execute(`
            ALTER TABLE time_entries
            ADD COLUMN input_minutes INT NULL AFTER hours,
            ADD COLUMN calculated_hours DECIMAL(5,2) NULL AFTER input_minutes
        `);
            // Update existing household tasks with weight factors
            const weightFactors = [
                { name: 'Kitchen cleanup', factor: 1.20, desc: 'Includes dishes, counter cleaning, and basic tidying' },
                { name: 'Vacuum entire apartment', factor: 1.00, desc: 'All rooms and hallways' },
                { name: 'Clean bathroom', factor: 1.30, desc: 'Toilet, sink, shower, and floor' },
                { name: 'Wash and hang laundry', factor: 0.80, desc: 'One full load from start to hanging' },
                { name: 'Empty dishwasher', factor: 0.70, desc: 'Put away all clean dishes' },
                { name: 'Take out trash', factor: 0.60, desc: 'All bins in house to curb' },
                { name: 'Mop floors', factor: 1.10, desc: 'All hard floors in living areas' },
                { name: 'Clean windows', factor: 1.50, desc: 'Interior and exterior cleaning' },
                { name: 'Change bed sheets', factor: 0.90, desc: 'Remove, wash, dry, and remake bed' },
                { name: 'Fold laundry', factor: 0.75, desc: 'Fold and put away one load' },
                { name: 'Clean refrigerator', factor: 1.25, desc: 'Remove items, clean shelves, organize' },
                { name: 'Garden work (1 hour)', factor: 1.00, desc: 'Weeding, planting, or maintenance tasks' },
                { name: 'Wash car', factor: 1.20, desc: 'Interior and exterior cleaning' },
                { name: 'Organize basement', factor: 1.40, desc: 'Sorting, cleaning, and arranging items' },
                { name: 'Grocery shopping', factor: 0.80, desc: 'Weekly shopping trip including transport' }
            ];
            for (const task of weightFactors) {
                yield connection.execute(`
                UPDATE household_tasks 
                SET weight_factor = ?, description = ?
                WHERE name = ?
            `, [task.factor, task.desc, task.name]);
            }
            // Add indexes for better performance
            try {
                yield connection.execute('CREATE INDEX idx_household_tasks_weight ON household_tasks(weight_factor)');
                yield connection.execute('CREATE INDEX idx_time_entries_input_minutes ON time_entries(input_minutes)');
                yield connection.execute('CREATE INDEX idx_time_entries_calculated ON time_entries(calculated_hours)');
            }
            catch (error) {
                // Indexes might already exist, ignore errors
                console.log('Some indexes already exist, continuing...');
            }
            // Update existing time_entries for backward compatibility
            yield connection.execute(`
            UPDATE time_entries 
            SET calculated_hours = hours 
            WHERE calculated_hours IS NULL
        `);
            console.log('Weight factors migration completed successfully!');
        }
        catch (error) {
            console.error('Error in weight factors migration:', error);
            throw error;
        }
    });
}
exports.migrateWeightFactors = migrateWeightFactors;
