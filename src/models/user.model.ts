export interface User {
    id?: number;
    username: string;
    password: string;
    role: 'admin' | 'user';
    created_at?: Date;
}