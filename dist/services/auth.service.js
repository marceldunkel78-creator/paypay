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
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../db/index");
const email_service_1 = require("./email.service");
class AuthService {
    constructor() {
        this.emailService = new email_service_1.EmailService();
    }
    register(username, email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('AuthService.register called with username:', username, 'email:', email);
                // Check if user already exists
                const existingUser = yield this.getUserByUsername(username);
                if (existingUser) {
                    throw new Error('Username already exists');
                }
                // Check if email already exists
                const existingEmail = yield this.getUserByEmail(email);
                if (existingEmail) {
                    throw new Error('Email already exists');
                }
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                const connection = yield (0, index_1.connectToDatabase)();
                // New users start as 'pending' and need admin approval
                const [result] = yield connection.execute('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)', [username, email, hashedPassword, 'user', 'pending']);
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
        });
    }
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [rows] = yield connection.execute('SELECT * FROM users WHERE username = ? AND status = ?', [username, 'active']);
            const users = rows;
            const user = users[0];
            if (user && (yield bcrypt_1.default.compare(password, user.password))) {
                const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
                return token;
            }
            return null;
        });
    }
    isAuthenticated(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
                return !!decoded;
            }
            catch (error) {
                return false;
            }
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [rows] = yield connection.execute('SELECT * FROM users WHERE id = ?', [id]);
            const users = rows;
            return users[0] || null;
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, index_1.connectToDatabase)();
            const [rows] = yield connection.execute('SELECT * FROM users WHERE username = ?', [username]);
            const users = rows;
            return users[0] || null;
        });
    }
    // Passwort ändern
    changePassword(userId, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                // Aktuellen User und Passwort abrufen
                const [rows] = yield connection.execute('SELECT password FROM users WHERE id = ?', [userId]);
                const users = rows;
                if (users.length === 0) {
                    throw new Error('User not found');
                }
                const user = users[0];
                // Aktuelles Passwort überprüfen
                const isCurrentPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
                if (!isCurrentPasswordValid) {
                    throw new Error('Current password is incorrect');
                }
                // Neues Passwort hashen und speichern
                const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, 10);
                const [result] = yield connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
                const updateResult = result;
                return updateResult.affectedRows > 0;
            }
            catch (error) {
                console.error('Error changing password:', error);
                throw error;
            }
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                const [rows] = yield connection.execute('SELECT * FROM users WHERE email = ?', [email]);
                const users = rows;
                return users.length > 0 ? users[0] : null;
            }
            catch (error) {
                console.error('Error fetching user by email:', error);
                return null;
            }
        });
    }
    // Admin-only methods for user management
    getPendingUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                const [rows] = yield connection.execute('SELECT id, username, email, role, status FROM users WHERE status = ? ORDER BY id DESC', ['pending']);
                return rows;
            }
            catch (error) {
                console.error('Error fetching pending users:', error);
                throw error;
            }
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                const [rows] = yield connection.execute('SELECT id, username, email, role, status FROM users ORDER BY id DESC');
                return rows;
            }
            catch (error) {
                console.error('Error fetching all users:', error);
                throw error;
            }
        });
    }
    approveUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                // First get user details for email notification
                const [userRows] = yield connection.execute('SELECT username, email FROM users WHERE id = ? AND status = ?', [userId, 'pending']);
                const users = userRows;
                if (users.length === 0) {
                    return false; // User not found or not pending
                }
                const user = users[0];
                // Update user status to active
                const [result] = yield connection.execute('UPDATE users SET status = ? WHERE id = ? AND status = ?', ['active', userId, 'pending']);
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
        });
    }
    suspendUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                const [result] = yield connection.execute('UPDATE users SET status = ? WHERE id = ?', ['suspended', userId]);
                const updateResult = result;
                return updateResult.affectedRows > 0;
            }
            catch (error) {
                console.error('Error suspending user:', error);
                throw error;
            }
        });
    }
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield (0, index_1.connectToDatabase)();
                // First get user details for potential email notification
                const [userRows] = yield connection.execute('SELECT username, email, status FROM users WHERE id = ?', [userId]);
                const users = userRows;
                if (users.length === 0) {
                    return false; // User not found
                }
                const user = users[0];
                const wasPending = user.status === 'pending';
                // Start transaction using query() instead of execute()
                yield connection.query('START TRANSACTION');
                try {
                    // First, delete all time entries for this user
                    yield connection.execute('DELETE FROM time_entries WHERE user_id = ?', [userId]);
                    // Then delete the user
                    const [result] = yield connection.execute('DELETE FROM users WHERE id = ?', [userId]);
                    // Commit transaction
                    yield connection.query('COMMIT');
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
                    yield connection.query('ROLLBACK');
                    throw error;
                }
            }
            catch (error) {
                console.error('Error deleting user:', error);
                throw error;
            }
        });
    }
}
exports.AuthService = AuthService;
