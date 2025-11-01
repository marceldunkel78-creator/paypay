import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    public async register(req: Request, res: Response): Promise<void> {
        try {
            console.log('Register request received:', req.body);
            const { username, password } = req.body;
            
            if (!username || !password) {
                res.status(400).json({ message: 'Username and password are required' });
                return;
            }
            
            const user = await this.authService.register(username, password);
            console.log('User registered successfully:', { id: user.id, username: user.username });
            res.status(201).json({ id: user.id, username: user.username, role: user.role });
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            res.status(400).json({ message: errorMessage });
        }
    }

    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { username, password } = req.body;
            const token = await this.authService.login(username, password);
            if (token) {
                res.status(200).json({ token });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            res.status(401).json({ message: errorMessage });
        }
    }

    // Passwort ändern
    public async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = (req as any).user;

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
            } else {
                res.status(500).json({ message: 'Fehler beim Ändern des Passworts' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMessage = error instanceof Error ? error.message : 'Fehler beim Ändern des Passworts';
            res.status(400).json({ message: errorMessage });
        }
    }
}