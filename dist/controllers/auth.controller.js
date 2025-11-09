"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    async register(req, res) {
        try {
            console.log('Register request received:', req.body);
            const { username, email, password } = req.body;
            if (!username || !email || !password) {
                res.status(400).json({ message: 'Username, email and password are required' });
                return;
            }
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({ message: 'Invalid email format' });
                return;
            }
            const user = await this.authService.register(username, email, password);
            console.log('User registered successfully:', { id: user.id, username: user.username, email: user.email });
            res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
        }
        catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            res.status(400).json({ message: errorMessage });
        }
    }
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const token = await this.authService.login(username, password);
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
    }
    // Passwort ändern
    async changePassword(req, res) {
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
            const success = await this.authService.changePassword(user.id, currentPassword, newPassword);
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
    }
    // Alle User abrufen (für Transfer-Modal)
    async getAllUsers(req, res) {
        try {
            console.log('Getting all users for transfer modal');
            const users = await this.authService.getAllUsers();
            console.log('All users:', users.map(u => ({ id: u.id, username: u.username, role: u.role, status: u.status })));
            // Nur aktive User mit 'user' Rolle für Transfers verfügbar machen (keine Admins)
            const activeUsers = users.filter(user => user.status === 'active' && user.role === 'user');
            console.log('Filtered active user-role users:', activeUsers.map(u => ({ id: u.id, username: u.username })));
            res.status(200).json(activeUsers);
        }
        catch (error) {
            console.error('Error getting all users:', error);
            res.status(500).json({ message: 'Error retrieving users' });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map