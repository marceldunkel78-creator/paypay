import { User } from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../db/index';

export class AuthService {
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
            
            const [result] = await connection.execute(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, 'user']
            );
            
            const insertResult = result as any;
            console.log('User inserted with ID:', insertResult.insertId);
            
            return {
                id: insertResult.insertId,
                username,
                email,
                password: hashedPassword,
                role: 'user'
            };
        } catch (error) {
            console.error('AuthService.register error:', error);
            throw error;
        }
    }

    async login(username: string, password: string): Promise<string | null> {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
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
}