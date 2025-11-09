"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.connectToDatabase = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
let connection = null;
const connectToDatabase = async () => {
    if (connection) {
        return connection;
    }
    try {
        // Parse DATABASE_URL from .env or use individual env vars
        const dbUrl = process.env.DATABASE_URL || '';
        let connectionConfig;
        if (dbUrl && dbUrl.startsWith('mysql://')) {
            // Handle URL format like mysql://user:pass@host:port/database
            try {
                const url = new URL(dbUrl);
                connectionConfig = {
                    host: url.hostname,
                    port: parseInt(url.port) || 3306,
                    user: url.username,
                    password: url.password || '',
                    database: url.pathname.slice(1), // Remove leading slash
                };
            }
            catch (urlError) {
                console.warn('Failed to parse DATABASE_URL, falling back to manual parsing');
                // Manual parsing for URLs without password
                const match = dbUrl.match(/mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/);
                if (match) {
                    connectionConfig = {
                        host: match[2],
                        port: parseInt(match[3]) || 3306,
                        user: match[1],
                        password: '',
                        database: match[4],
                    };
                }
                else {
                    throw new Error('Invalid DATABASE_URL format');
                }
            }
        }
        else {
            // Fallback to individual environment variables
            connectionConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'time_account_db',
            };
        }
        console.log('Connecting to database with config:', {
            ...connectionConfig,
            password: connectionConfig.password ? '[HIDDEN]' : '[EMPTY]'
        });
        connection = await promise_1.default.createConnection(connectionConfig);
        console.log('Database connection established');
        return connection;
    }
    catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};
exports.connectToDatabase = connectToDatabase;
const initDatabase = async () => {
    await (0, exports.connectToDatabase)();
};
exports.initDatabase = initDatabase;
exports.default = exports.connectToDatabase;
//# sourceMappingURL=index.js.map