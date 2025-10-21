export interface User {
    id: number;
    username: string;
    password: string;
    role: 'admin' | 'user';
}

export interface TimeAccount {
    id: number;
    userId: number;
    hours: number;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApprovalRequest {
    id: number;
    timeAccountId: number;
    adminId: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}