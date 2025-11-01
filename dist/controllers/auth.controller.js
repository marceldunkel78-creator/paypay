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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Register request received:', req.body);
                const { username, password } = req.body;
                if (!username || !password) {
                    res.status(400).json({ message: 'Username and password are required' });
                    return;
                }
                const user = yield this.authService.register(username, password);
                console.log('User registered successfully:', { id: user.id, username: user.username });
                res.status(201).json({ id: user.id, username: user.username, role: user.role });
            }
            catch (error) {
                console.error('Registration error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Registration failed';
                res.status(400).json({ message: errorMessage });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                const token = yield this.authService.login(username, password);
                if (token) {
                    res.status(200).json({ token });
                }
                else {
                    res.status(401).json({ message: 'Invalid credentials' });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Login failed';
                res.status(401).json({ message: errorMessage });
            }
        });
    }
    // Passwort ändern
    changePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { currentPassword, newPassword } = req.body;
                const user = req.user;
                if (!user) {
                    res.status(401).json({ message: 'Nicht authentifiziert' });
                    return;
                }
                if (!currentPassword || !newPassword) {
                    res.status(400).json({ message: 'Aktuelles und neues Passwort sind erforderlich' });
                    return;
                }
                if (newPassword.length < 6) {
                    res.status(400).json({ message: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
                    return;
                }
                const success = yield this.authService.changePassword(user.id, currentPassword, newPassword);
                if (success) {
                    res.status(200).json({ message: 'Passwort erfolgreich geändert' });
                }
                else {
                    res.status(500).json({ message: 'Fehler beim Ändern des Passworts' });
                }
            }
            catch (error) {
                console.error('Error changing password:', error);
                const errorMessage = error instanceof Error ? error.message : 'Fehler beim Ändern des Passworts';
                res.status(400).json({ message: errorMessage });
            }
        });
    }
}
exports.AuthController = AuthController;
