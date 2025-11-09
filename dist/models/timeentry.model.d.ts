export interface TimeEntry {
    id?: number;
    user_id: number;
    task_id?: number;
    hours: number;
    entry_type: 'productive' | 'screen_time';
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at?: Date;
    input_minutes?: number | null;
    calculated_hours?: number | null;
    username?: string;
    task_name?: string;
}
export interface UserTimeBalance {
    user_id: number;
    current_balance: number;
    last_updated?: Date;
}
export interface TimeAccount {
    id?: number;
    user_id: number;
    hours: number;
    request_date?: Date;
    status?: 'pending' | 'approved' | 'rejected';
}
//# sourceMappingURL=timeentry.model.d.ts.map