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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const index_1 = require("./db/index");
const migrate_complete_1 = require("./db/migrate-complete");
const password_protect_middleware_1 = require("./middlewares/password-protect.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const timeaccount_routes_1 = __importDefault(require("./routes/timeaccount.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const timeentry_routes_1 = require("./routes/timeentry.routes");
const household_task_routes_1 = require("./routes/household-task.routes");
const app = (0, express_1.default)();
// Middleware
app.use((0, express_1.json)());
app.use((0, express_1.urlencoded)({ extended: true }));
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
            timeaccounts: '/api/timeaccount (GET, POST /balance, POST /transfer-hours)',
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
// Database connection and single migration
(0, index_1.connectToDatabase)()
    .then(async (connection) => {
    console.log('Database connected successfully');
    // Run single, complete migration
    await (0, migrate_complete_1.runCompleteMigration)();
    console.log('All migrations completed successfully');
})
    .catch((error) => {
    console.error('Database connection failed:', error);
});
exports.default = app;
//# sourceMappingURL=app.js.map