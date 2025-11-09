import { User } from '../models/user.model';
export declare class AuthService {
    private emailService;
    constructor();
    register(username: string, email: string, password: string): Promise<User>;
    login(username: string, password: string): Promise<string | null>;
    isAuthenticated(token: string): Promise<boolean>;
    getUserById(id: number): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;
    getUserByEmail(email: string): Promise<User | null>;
    getPendingUsers(): Promise<User[]>;
    getAllUsers(): Promise<User[]>;
    approveUser(userId: number): Promise<boolean>;
    suspendUser(userId: number): Promise<boolean>;
    activateUser(userId: number): Promise<boolean>;
    deleteUser(userId: number): Promise<boolean>;
}
//# sourceMappingURL=auth.service.d.ts.map