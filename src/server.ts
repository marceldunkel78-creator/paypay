import express from 'express';
import { createServer } from 'http';
import { initDatabase } from './db/index';
import { config } from './config/default';

const app = express();
const server = createServer(app);

// Middleware and routes setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database connection
initDatabase();

// Define the port
const PORT = config.port || 3000;

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});