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
class AuthService {
    register(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('AuthService.register called with username:', username);
                // Check if user already exists
                const existingUser = yield this.getUserByUsername(username);
                if (existingUser) {
                    throw new Error('Username already exists');
                }
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                const connection = yield (0, index_1.connectToDatabase)();
                const [result] = yield connection.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'user']);
                const insertResult = result;
                console.log('User inserted with ID:', insertResult.insertId);
                return {
                    id: insertResult.insertId,
                    username,
                    password: hashedPassword,
                    role: 'user'
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
            const [rows] = yield connection.execute('SELECT * FROM users WHERE username = ?', [username]);
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
}
exports.AuthService = AuthService;
