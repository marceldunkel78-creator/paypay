export interface HouseholdTask {
    id: number;
    name: string;
    hours: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateHouseholdTaskRequest {
    name: string;
    hours: number;
    is_active?: boolean;
}

export interface UpdateHouseholdTaskRequest {
    name?: string;
    hours?: number;
    is_active?: boolean;
}