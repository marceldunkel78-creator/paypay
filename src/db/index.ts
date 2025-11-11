import mysql from 'mysql2/promise';
import config from '../config/default';

let pool: mysql.Pool | null = null;

// Get database pool
export const getPool = (): mysql.Pool => {
    if (!pool) {
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
                    password: url.password || '', // Handle missing password
                    database: url.pathname.slice(1), // Remove leading slash
                };
            } catch (urlError) {
                console.warn('Failed to parse DATABASE_URL, falling back to manual parsing');
                // Manual parsing for URLs without password
                const match = dbUrl.match(/mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/);
                if (match) {
                    connectionConfig = {
                        host: match[2],
                        port: parseInt(match[3]) || 3306,
                        user: match[1],
                        password: '', // No password in URL
                        database: match[4],
                    };
                } else {
                    throw new Error('Invalid DATABASE_URL format');
                }
            }
        } else {
            // Fallback to individual environment variables
            connectionConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'time_account_db',
            };
        }

        console.log('Creating database pool with config:', {
            ...connectionConfig,
            password: connectionConfig.password ? '[HIDDEN]' : '[EMPTY]'
        });
        
        // Create connection pool
        pool = mysql.createPool({
            ...connectionConfig,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('Database pool created successfully');
    }
    
    return pool;
};

export const connectToDatabase = async (): Promise<mysql.Pool> => {
    return getPool();
};

export const initDatabase = async (): Promise<void> => {
    await connectToDatabase();
};

export default connectToDatabase;