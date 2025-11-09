import express from 'express';
import { json, urlencoded } from 'body-parser';
import { connectToDatabase } from './db';
import { migrateTimeEntries } from './db/migrate-timeentries';
import { migrateApprovalSystem } from './db/migrate-approval';
import { migrateHouseholdTasks } from './db/migrate-household-tasks';
import { migrateTimeEntriesTaskId } from './db/migrate-timeentries-task-id';
import { migrateUserEmail } from './db/migrate-user-email';
import { migrateUserStatus } from './db/migrate-user-status';
import { migrateWeightFactors } from './db/migrate-weight-factors';
import { migrateTimeTransfers } from './db/migrate-time-transfers';
import { removeDefaultUsers } from './db/migrate-remove-default-users';
import authRoutes from './routes/auth.routes';
import timeAccountRoutes from './routes/timeaccount.routes';
import adminRoutes from './routes/admin.routes';
import { TimeEntryRoutes } from './routes/timeentry.routes';
import { HouseholdTaskRoutes } from './routes/household-task.routes';
import { passwordProtect } from './middlewares/password-protect.middleware';

const app = express();

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

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
const timeEntryRoutes = new TimeEntryRoutes();
const householdTaskRoutes = new HouseholdTaskRoutes();

app.use('/api/auth', authRoutes); // No password protection for auth
app.use('/api/timeaccount', timeAccountRoutes); // Only JWT auth, no password protection
app.use('/api/timeentries', timeEntryRoutes.router); // Only JWT auth, no password protection
app.use('/api/household-tasks', householdTaskRoutes.router); // Only JWT auth, no password protection
app.use('/api/admin', passwordProtect, adminRoutes);

// Database connection and migration
connectToDatabase()
  .then(async (connection) => {
    console.log('Database connected successfully');
    // Run time entries migration
    await migrateTimeEntries();
    // Run approval system migration
    await migrateApprovalSystem();
    // Run household tasks migration
    await migrateHouseholdTasks();
    // Run time entries task_id migration
    await migrateTimeEntriesTaskId();
    // Run user email migration
    await migrateUserEmail();
    // Run user status migration
    await migrateUserStatus();
    // Run weight factors migration
    await migrateWeightFactors(connection);
    // Run time transfers migration
    await migrateTimeTransfers();
    // Remove default test users
    await removeDefaultUsers();
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

export default app;