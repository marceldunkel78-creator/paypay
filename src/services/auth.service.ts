import { User } from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../db/index';
import { EmailService } from './email.service';

export class AuthService {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    async register(username: string, email: string, password: string): Promise<User> {
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
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const connection = await connectToDatabase();
            
            // New users start as 'pending' and need admin approval
            const [result] = await connection.execute(
                'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [username, email, hashedPassword, 'user', 'pending']
            );
            
            const insertResult = result as any;
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
        } catch (error) {
            console.error('AuthService.register error:', error);
            throw error;
        }
    }

    async login(username: string, password: string): Promise<string | null> {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND status = ?',
            [username, 'active']
        );
        
        const users = rows as User[];
        const user = users[0];
        
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role }, 
                process.env.JWT_SECRET || 'secret', 
                { expiresIn: '1h' }
            );
            return token;
        }
        return null;
    }

    async isAuthenticated(token: string): Promise<boolean> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            return !!decoded;
        } catch (error) {
            return false;
        }
    }

    async getUserById(id: number): Promise<User | null> {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        const users = rows as User[];
        return users[0] || null;
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        const users = rows as User[];
        return users[0] || null;
    }

    // Passwort ändern
    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
        try {
            const connection = await connectToDatabase();
            
            // Aktuellen User und Passwort abrufen
            const [rows] = await connection.execute(
                'SELECT password FROM users WHERE id = ?',
                [userId]
            );
            
            const users = rows as any[];
            if (users.length === 0) {
                throw new Error('User not found');
            }
            
            const user = users[0];
            
            // Aktuelles Passwort überprüfen
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            
            // Neues Passwort hashen und speichern
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            const [result] = await connection.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedNewPassword, userId]
            );
            
            const updateResult = result as any;
            return updateResult.affectedRows > 0;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const connection = await connectToDatabase();
            const [rows] = await connection.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            
            const users = rows as User[];
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            console.error('Error fetching user by email:', error);
            return null;
        }
    }

    // Admin-only methods for user management
    async getPendingUsers(): Promise<User[]> {
        try {
            const connection = await connectToDatabase();
            const [rows] = await connection.execute(
                'SELECT id, username, email, role, status FROM users WHERE status = ? ORDER BY id DESC',
                ['pending']
            );
            
            return rows as User[];
        } catch (error) {
            console.error('Error fetching pending users:', error);
            throw error;
        }
    }

    async getAllUsers(): Promise<User[]> {
        try {
            const connection = await connectToDatabase();
            const [rows] = await connection.execute(
                'SELECT id, username, email, role, status FROM users ORDER BY id DESC'
            );
            
            return rows as User[];
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }

    async approveUser(userId: number): Promise<boolean> {
        try {
            const connection = await connectToDatabase();
            
            // First get user details for email notification
            const [userRows] = await connection.execute(
                'SELECT username, email FROM users WHERE id = ? AND status = ?',
                [userId, 'pending']
            );
            
            const users = userRows as any[];
            if (users.length === 0) {
                return false; // User not found or not pending
            }
            
            const user = users[0];
            
            // Update user status to active
            const [result] = await connection.execute(
                'UPDATE users SET status = ? WHERE id = ? AND status = ?',
                ['active', userId, 'pending']
            );
            
            const updateResult = result as any;
            const success = updateResult.affectedRows > 0;
            
            // Send approval confirmation email (async, don't wait)
            if (success) {
                this.emailService.sendUserApprovalConfirmation(user.email, user.username)
                    .then(() => console.log(`User approval confirmation sent to ${user.email}`))
                    .catch(error => console.warn('Failed to send user approval confirmation:', error));
            }
            
            return success;
        } catch (error) {
            console.error('Error approving user:', error);
            throw error;
        }
    }

    async suspendUser(userId: number): Promise<boolean> {
        try {
            const connection = await connectToDatabase();
            const [result] = await connection.execute(
                'UPDATE users SET status = ? WHERE id = ?',
                ['suspended', userId]
            );
            
            const updateResult = result as any;
            return updateResult.affectedRows > 0;
        } catch (error) {
            console.error('Error suspending user:', error);
            throw error;
        }
    }

    async activateUser(userId: number): Promise<boolean> {
        try {
            const connection = await connectToDatabase();
            const [result] = await connection.execute(
                'UPDATE users SET status = ? WHERE id = ? AND status = ?',
                ['active', userId, 'suspended']
            );
            
            const updateResult = result as any;
            return updateResult.affectedRows > 0;
        } catch (error) {
            console.error('Error activating user:', error);
            throw error;
        }
    }

    async deleteUser(userId: number): Promise<boolean> {
        try {
            const connection = await connectToDatabase();
            
            // First get user details for potential email notification
            const [userRows] = await connection.execute(
                'SELECT username, email, status FROM users WHERE id = ?',
                [userId]
            );
            
            const users = userRows as any[];
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
                
                const deleteResult = result as any;
                const success = deleteResult.affectedRows > 0;
                
                // Send rejection email if user was pending (async, don't wait)
                if (success && wasPending) {
                    this.emailService.sendUserRejectionNotification(user.email, user.username)
                        .then(() => console.log(`User rejection notification sent to ${user.email}`))
                        .catch(error => console.warn('Failed to send user rejection notification:', error));
                }
                
                return success;
            } catch (error) {
                // Rollback on error
                await connection.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}