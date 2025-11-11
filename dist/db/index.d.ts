import mysql from 'mysql2/promise';
export declare const getPool: () => mysql.Pool;
export declare const connectToDatabase: () => Promise<mysql.Pool>;
export declare const initDatabase: () => Promise<void>;
export default connectToDatabase;
//# sourceMappingURL=index.d.ts.map