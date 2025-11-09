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

export interface HouseholdTask {
    id: number;
    name: string;
    hours: number;
    weight_factor: number;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface TimeEntry {
    id: number;
    user_id: number;
    task_id: number | null;
    hours: number;
    input_minutes: number | null;
    calculated_hours: number | null;
    entry_type: 'productive' | 'screen_time';
    description: string | null;
    status: 'pending' | 'approved' | 'rejected';
    approved_at: Date | null;
    approved_by: number | null;
    created_at: Date;
}