"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../db/index");
const email_service_1 = require("./email.service");
class AuthService {
    constructor() {
        this.emailService = new email_service_1.EmailService();
    }
    async register(username, email, password) {
        try {
            console.log('AuthService.register called with username:', username, 'email:', email);
            // Check if user already exists
            const existingUser = await this.getUserByUsername(username);
            if (existingUser) {
                throw new Error('Username already exists');
            }
            // Check if email already exists
            const existingEmail = await this.getUserByEmail(email);
            if (existingEmail) {
                throw new Error('Email already exists');
            }
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            const connection = await (0, index_1.connectToDatabase)();
            // New users start as 'pending' and need admin approval
            const [result] = await connection.execute('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)', [username, email, hashedPassword, 'user', 'pending']);
            const insertResult = result;
            console.log('User inserted with ID:', insertResult.insertId, '(status: pending)');
            // Send email notification to admins about new registration (async, don't wait)
            this.emailService.sendNewUserRegistrationNotification(username, email)
                .catch(error => console.warn('Failed to send new user registration notification:', error));
            return {
                id: insertResult.insertId,
                username,
                email,
                password: hashedPassword,
                role: 'user',
                status: 'pending'
            };
        }
        catch (error) {
            console.error('AuthService.register error:', error);
            throw error;
        }
    }
    async login(username, password) {
        const connection = await (0, index_1.connectToDatabase)();
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ? AND status = ?', [username, 'active']);
        const users = rows;
        const user = users[0];
        if (user && await bcrypt_1.default.compare(password, user.password)) {
            const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
            return token;
        }
        return null;
    }
    async isAuthenticated(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            return !!decoded;
        }
        catch (error) {
            return false;
        }
    }
    async getUserById(id) {
        const connection = await (0, index_1.connectToDatabase)();
        const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
        const users = rows;
        return users[0] || null;
    }
    async getUserByUsername(username) {
        const connection = await (0, index_1.connectToDatabase)();
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        const users = rows;
        return users[0] || null;
    }
    // Passwort ändern
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const connection = await (0, index_1.connectToDatabase)();
            // Aktuellen User und Passwort abrufen
            const [rows] = await connection.execute('SELECT password FROM users WHERE id = ?', [userId]);
            const users = rows;
            if (users.length === 0) {
                throw new Error('User not found');
            }
            const user = users[0];
            // Aktuelles Passwort überprüfen
            const isCurrentPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            // Neues Passwort hashen und speichern
            const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 10);
            const [result] = await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
            const updateResult = result;
            return updateResult.affectedRows > 0;
        }
        catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            const connection = await (0, index_1.connectToDatabase)();
            const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
            const users = rows;
            return users.length > 0 ? users[0] : null;
        }
        catch (error) {
            console.error('Error fetching user by email:', error);
            return null;
        }
    }
    // Admin-only methods for user management
    async getPendingUsers() {
        try {
            const connection = await (0, index_1.connectToDatabase)();
            const [rows] = await connection.execute('SELECT id, username, email, role, status FROM users WHERE status = ? ORDER BY id DESC', ['pending']);
            return rows;
        }
        catch (error) {
            console.error('Error fetching pending users:', error);
            throw error;
        }
    }
    async getAllUsers() {
        try {
            const connection = await (0, index_1.connectToDatabase)();
            const [rows] = await connection.execute('SELECT id, username, email, role, status FROM users ORDER BY id DESC');
            return rows;
        }
        catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }
    async approveUser(userId) {
        try {
            const connection = await (0, index_1.connectToDatabase)();
            // First get user details for email notification
            const [userRows] = await connection.execute('SELECT username, email FROM users WHERE id = ? AND status = ?', [userId, 'pending']);
            const users = userRows;
            if (users.length === 0) {
                return false; // User not found or not pending
            }
            const user = users[0];
            // Update user status to active
            const [result] = await connection.execute('UPDATE users SET status = ? WHERE id = ? AND status = ?', ['active', userId, 'pending']);
            const updateResult = result;
            const success = updateResult.affectedRows > 0;
            // Send approval confirmation email (async, don't wait)
            if (success) {
                this.emailService.sendUserApprovalConfirmation(user.email, user.username)
                    .then(() => console.log(`User approval confirmation sent to ${user.email}`))
                    .catch(error => console.warn('Failed to send user approval confirmation:', error));
            }
            return success;
        }
        catch (error) {
            console.error('Error approving user:', error);
            throw error;
        }
    }
    async suspendUser(userId) {
        try {
            const connection = await (0, index_1.connectToDatabase)();
            const [result] = await connection.execute('UPDATE users SET status = ? WHERE id = ?', ['suspended', userId]);
            const updateResult = result;
            return updateResult.affectedRows > 0;
        }
        catch (error) {
            console.error('Error suspending user:', error);
            throw error;
        }
    }
    async activateUser(userId) {
        try {
            const connection = await (0, index_1.connectToDatabase)();
            const [result] = await connection.execute('UPDATE users SET status = ? WHERE id = ? AND status = ?', ['active', userId, 'suspended']);
            const updateResult = result;
            return updateResult.affectedRows > 0;
        }
        catch (error) {
            console.error('Error activating user:', error);
            throw error;
        }
    }
    async deleteUser(userId) {
        try {
            const connection = await (0, index_1.connectToDatabase)();
            // First get user details for potential email notification
            const [userRows] = await connection.execute('SELECT username, email, status FROM users WHERE id = ?', [userId]);
            const users = userRows;
            if (users.length === 0) {
                return false; // User not found
            }
            const user = users[0];
            const wasPending = user.status === 'pending';
            // Start transaction using query() instead of execute()
            await connection.query('START TRANSACTION');
            try {
                // First, delete all time entries for this user
                await connection.execute('DELETE FROM time_entries WHERE user_id = ?', [userId]);
                // Then delete the user
                const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
                // Commit transaction
                await connection.query('COMMIT');
                const deleteResult = result;
                const success = deleteResult.affectedRows > 0;
                // Send rejection email if user was pending (async, don't wait)
                if (success && wasPending) {
                    this.emailService.sendUserRejectionNotification(user.email, user.username)
                        .then(() => console.log(`User rejection notification sent to ${user.email}`))
                        .catch(error => console.warn('Failed to send user rejection notification:', error));
                }
                return success;
            }
            catch (error) {
                // Rollback on error
                await connection.query('ROLLBACK');
                throw error;
            }
        }
        catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map