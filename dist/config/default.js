"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'time_account_db',
    },
    server: {
        port: process.env.PORT || 3000,
    },
    email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASS || '',
        from: process.env.EMAIL_USER || '',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },
};
//# sourceMappingURL=default.js.map