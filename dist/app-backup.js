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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const db_1 = require("./db");
const migrate_timeentries_1 = require("./db/migrate-timeentries");
const migrate_approval_1 = require("./db/migrate-approval");
const migrate_household_tasks_1 = require("./db/migrate-household-tasks");
const migrate_timeentries_task_id_1 = require("./db/migrate-timeentries-task-id");
const migrate_user_email_1 = require("./db/migrate-user-email");
const migrate_user_status_1 = require("./db/migrate-user-status");
const migrate_weight_factors_1 = require("./db/migrate-weight-factors");
const migrate_time_transfers_1 = require("./db/migrate-time-transfers");
const migrate_remove_default_users_1 = require("./db/migrate-remove-default-users");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const timeaccount_routes_1 = __importDefault(require("./routes/timeaccount.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const timeentry_routes_1 = require("./routes/timeentry.routes");
const household_task_routes_1 = require("./routes/household-task.routes");
const password_protect_middleware_1 = require("./middlewares/password-protect.middleware");
const app = (0, express_1.default)();
// Middleware
app.use((0, body_parser_1.json)());
app.use((0, body_parser_1.urlencoded)({ extended: true }));
// Serve static files from public directory
app.use(express_1.default.static('public'));
// Public routes (no password protection)
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});
// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});
// API info endpoint  
app.get('/api', (req, res) => {
    res.json({
        message: 'Time Account Management API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth (POST /register, POST /login)',
            timeaccounts: '/api/timeaccounts (GET, POST /time-accounts)',
            timeentries: '/api/timeentries (POST /, GET /, GET /balance, DELETE /:id)',
            admin: '/api/admin (GET /requests, POST /approve/:id, POST /reject/:id)'
        },
        status: 'Server is running successfully'
    });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'Connected'
    });
});
// Routes with different protection levels
const timeEntryRoutes = new timeentry_routes_1.TimeEntryRoutes();
const householdTaskRoutes = new household_task_routes_1.HouseholdTaskRoutes();
app.use('/api/auth', auth_routes_1.default); // No password protection for auth
app.use('/api/timeaccount', timeaccount_routes_1.default); // Only JWT auth, no password protection
app.use('/api/timeentries', timeEntryRoutes.router); // Only JWT auth, no password protection
app.use('/api/household-tasks', householdTaskRoutes.router); // Only JWT auth, no password protection
app.use('/api/admin', password_protect_middleware_1.passwordProtect, admin_routes_1.default);
// Database connection and migration
(0, db_1.connectToDatabase)()
    .then((connection) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Database connected successfully');
    // Run time entries migration
    yield (0, migrate_timeentries_1.migrateTimeEntries)();
    // Run approval system migration
    yield (0, migrate_approval_1.migrateApprovalSystem)();
    // Run household tasks migration
    yield (0, migrate_household_tasks_1.migrateHouseholdTasks)();
    // Run time entries task_id migration
    yield (0, migrate_timeentries_task_id_1.migrateTimeEntriesTaskId)();
    // Run user email migration
    yield (0, migrate_user_email_1.migrateUserEmail)();
    // Run user status migration
    yield (0, migrate_user_status_1.migrateUserStatus)();
    // Run weight factors migration
    yield (0, migrate_weight_factors_1.migrateWeightFactors)(connection);
    // Run time transfers migration
    yield (0, migrate_time_transfers_1.migrateTimeTransfers)();
    // Remove default test users
    yield (0, migrate_remove_default_users_1.removeDefaultUsers)();
}))
    .catch((error) => {
    console.error('Database connection failed:', error);
});
exports.default = app;
