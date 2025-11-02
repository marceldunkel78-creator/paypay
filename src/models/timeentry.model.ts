export interface TimeEntry {
    id?: number;
    user_id: number;
    task_id?: number; // Referenz zur Hausarbeit (optional für Rückwärtskompatibilität)
    hours: number; // Kann positiv (produktive Zeit) oder negativ (Bildschirmzeit) sein
    entry_type: 'productive' | 'screen_time';
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at?: Date;
    approved_at?: Date;
    approved_by?: number; // Admin user_id who approved
    // Zusätzliche Felder für erweiterte Anzeige
    username?: string;
    task_name?: string; // Name der Hausarbeit für Anzeige
}

export interface UserTimeBalance {
    user_id: number;
    current_balance: number;
    last_updated?: Date;
}

// Legacy Interface für Kompatibilität
export interface TimeAccount {
    id?: number;
    user_id: number;
    hours: number;
    request_date?: Date;
    status?: 'pending' | 'approved' | 'rejected';
}