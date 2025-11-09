export interface User {
    id?: number;
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    status: 'active' | 'pending' | 'suspended';
    created_at?: Date;
}
//# sourceMappingURL=user.model.d.ts.map