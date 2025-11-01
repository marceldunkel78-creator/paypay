import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initDatabase } from './db/index';
import config from './config/default';

// Initialize database connection
initDatabase();

// Define the port
const PORT = parseInt(config.server.port as string) || 3000;

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});