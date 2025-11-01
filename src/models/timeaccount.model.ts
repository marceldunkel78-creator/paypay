export interface TimeAccount {
    id?: number;
    user_id: number;
    hours: number;
    request_date?: Date;
    status?: 'pending' | 'approved' | 'rejected';
}