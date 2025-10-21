import { User } from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
    private users: User[] = []; // This should be replaced with a database call

    async register(username: string, password: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser: User = { username, password: hashedPassword, role: 'user' };
        this.users.push(newUser); // This should be replaced with a database call
        return newUser;
    }

    async login(username: string, password: string): Promise<string | null> {
        const user = this.users.find(u => u.username === username); // This should be replaced with a database call
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
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
}